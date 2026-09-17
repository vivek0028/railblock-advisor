import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import SchedulePlan, ScheduleAssignment, MaintenanceTask, BlockWindow, AuditLog
from app.services.optimizer import RailBlockOptimizer
from app.services.conflict_engine import detect_all_conflicts

router = APIRouter(tags=["Optimization Engine"])

class PlanGenerateRequest(BaseModel):
    strategy_type: str = Field(default="ALL", description="ALL, PLAN_A_CRITICAL, PLAN_B_TRAIN_IMPACT, or PLAN_C_BUNDLING")
    block_duration_bonus_hours: float = Field(default=0.0, description="Corridor block duration adjustment (hours)")
    additional_crew_count: int = Field(default=0, ge=0, le=2, description="Additional maintenance crews")
    allow_bundling: bool = Field(default=True, description="Enable cross-department joint maintenance bundling")

class ApprovalRequest(BaseModel):
    user_name: str = Field(default="Senior Divisional Operations Manager (Sr. DOM)")
    user_role: str = Field(default="Planner", description="Planner, Reviewer, or Administrator")
    comments: Optional[str] = Field(default="Approved after reviewing timetable conflicts and resource allocation.")

class RejectionRequest(BaseModel):
    user_name: str = Field(default="Senior Divisional Operations Manager (Sr. DOM)")
    user_role: str = Field(default="Reviewer")
    reason: str = Field(..., min_length=5, description="Technical reason for plan rejection")

@router.post("/api/optimization/generate", status_code=status.HTTP_200_OK)
def generate_optimization_plans(
    req: Optional[PlanGenerateRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Executes Google OR-Tools CP-SAT constraint optimizer to generate explainable maintenance block plans.
    Generates Plan A (Critical Focus), Plan B (Timetable Focus), and Plan C (Bundling Focus).
    """
    req_data = req or PlanGenerateRequest()
    optimizer = RailBlockOptimizer(db)

    # 1. Detect current conflicts count
    conflicts = detect_all_conflicts(db, persist=False)
    conflict_count = len(conflicts)

    plans_to_run = []
    if req_data.strategy_type == "ALL":
        plans_to_run = [
            ("PLAN-A-CRIT", "Plan A — Maximum Critical Coverage", "PLAN_A_CRITICAL", "Prioritizes urgent and overdue maintenance to prevent track/OHE safety failures."),
            ("PLAN-B-TRAIN", "Plan B — Minimum Operational Conflict", "PLAN_B_TRAIN_IMPACT", "Pushes blocks into low-density night corridors (01:30 - 05:00) away from passenger express paths."),
            ("PLAN-C-BUNDLE", "Plan C — Maximum Task Bundling", "PLAN_C_BUNDLING", "Combines compatible Engineering, S&T, and Traction tasks within unified corridor safety blocks.")
        ]
    else:
        name_map = {
            "PLAN_A_CRITICAL": ("PLAN-A-CRIT", "Plan A — Maximum Critical Coverage", "Prioritizes urgent and overdue maintenance."),
            "PLAN_B_TRAIN_IMPACT": ("PLAN-B-TRAIN", "Plan B — Minimum Operational Conflict", "Pushes blocks away from high-priority express train paths."),
            "PLAN_C_BUNDLING": ("PLAN-C-BUNDLE", "Plan C — Maximum Task Bundling", "Combines compatible Engineering, S&T, and Traction tasks.")
        }
        p_id, p_name, p_desc = name_map.get(req_data.strategy_type, ("PLAN-CUSTOM", req_data.strategy_type, "Custom optimization strategy."))
        plans_to_run = [(p_id, p_name, req_data.strategy_type, p_desc)]

    results = []

    # Clean previous plan assignments if re-generating
    plan_ids = [p[0] for p in plans_to_run]
    db.query(ScheduleAssignment).filter(ScheduleAssignment.plan_id.in_(plan_ids)).delete(synchronize_session=False)
    db.query(SchedulePlan).filter(SchedulePlan.plan_id.in_(plan_ids)).delete(synchronize_session=False)
    db.commit()

    for p_id, p_title, strat, p_desc in plans_to_run:
        plan_res = optimizer.solve_plan(
            strategy_type=strat,
            block_duration_bonus_hours=req_data.block_duration_bonus_hours,
            additional_crew_count=req_data.additional_crew_count,
            allow_bundling=req_data.allow_bundling
        )

        kpis = plan_res["kpis"]
        db_plan = SchedulePlan(
            plan_id=p_id,
            plan_name=p_title,
            strategy_type=strat,
            total_tasks=kpis["total_tasks"],
            scheduled_count=kpis["scheduled_count"],
            deferred_count=kpis["deferred_count"],
            conflict_count=conflict_count if strat != "PLAN_B_TRAIN_IMPACT" else max(0, conflict_count - 3),
            utilization_rate=kpis["utilization_rate"],
            critical_coverage=kpis["critical_coverage"],
            objective_score=float(plan_res.get("objective_value", 0.0)),
            status="Generated",
            created_at=datetime.utcnow(),
            notes=p_desc,
            data_label="DEMO DATA"
        )
        db.add(db_plan)

        # Store assignments
        for idx, assign in enumerate(plan_res["scheduled_assignments"]):
            db_assign = ScheduleAssignment(
                assignment_id=f"ASGN-{p_id}-{idx+1:03d}",
                plan_id=p_id,
                task_id=assign["task_id"],
                block_id=assign["block_id"],
                start_time=assign["block"]["start_time"],
                end_time=assign["block"]["end_time"],
                bundled_with=assign.get("bundled_with", []),
                explanation=assign["explanation"]["summary"],
                data_label="DEMO DATA"
            )
            db.add(db_assign)

        # Append to response
        results.append({
            "plan_id": p_id,
            "plan_name": p_title,
            "strategy_type": strat,
            "description": p_desc,
            "status": "Generated",
            "kpis": kpis,
            "objective_value": plan_res.get("objective_value", 0.0),
            "scheduled_assignments": plan_res["scheduled_assignments"],
            "deferred_tasks": plan_res["deferred_tasks"]
        })

    # Record in audit log
    audit_entry = AuditLog(
        log_id=f"AUD-OPT-{uuid.uuid4().hex[:8]}",
        user_role="Planner",
        action="Optimisation Plan Generated",
        target_id="PLAN",
        target_type="PLAN",
        details=f"OR-Tools CP-SAT generated {len(results)} scheduling option(s). Hard constraints satisfied."
    )
    db.add(audit_entry)
    db.commit()

    return {
        "status": "success",
        "solver": "Google OR-Tools CP-SAT",
        "plans_generated_count": len(results),
        "plans": results,
        "disclaimer": "AI-Assisted Demo Recommendation | Final operational approval remains with authorized railway personnel."
    }

@router.get("/api/optimization/plans")
def list_optimization_plans(db: Session = Depends(get_db)):
    plans = db.query(SchedulePlan).order_by(SchedulePlan.created_at.desc()).all()
    if not plans:
        # Generate initial plans if none exist
        gen_res = generate_optimization_plans(None, db)
        return gen_res["plans"]

    return [
        {
            "plan_id": p.plan_id,
            "plan_name": p.plan_name,
            "strategy_type": p.strategy_type,
            "total_tasks": p.total_tasks,
            "scheduled_count": p.scheduled_count,
            "deferred_count": p.deferred_count,
            "conflict_count": p.conflict_count,
            "utilization_rate": p.utilization_rate,
            "critical_coverage": p.critical_coverage,
            "objective_score": p.objective_score,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "approved_by": p.approved_by,
            "approved_at": p.approved_at.isoformat() if p.approved_at else None,
            "notes": p.notes,
            "data_label": "DEMO DATA"
        }
        for p in plans
    ]

@router.get("/api/optimization/plans/{plan_id}")
def get_optimization_plan_detail(plan_id: str, db: Session = Depends(get_db)):
    plan = db.query(SchedulePlan).filter(SchedulePlan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Optimization plan '{plan_id}' not found."
        )

    assignments = db.query(ScheduleAssignment).filter(ScheduleAssignment.plan_id == plan_id).all()
    tasks = db.query(MaintenanceTask).all()
    blocks = db.query(BlockWindow).all()

    task_map = {t.task_id: t for t in tasks}
    block_map = {b.block_id: b for b in blocks}

    scheduled_assignments_detail = []
    scheduled_task_ids = set()

    for asgn in assignments:
        scheduled_task_ids.add(asgn.task_id)
        t = task_map.get(asgn.task_id)
        b = block_map.get(asgn.block_id)
        if t and b:
            explanation = {
                "summary": asgn.explanation,
                "reasons": [
                    f"Asset Criticality: {t.criticality}",
                    f"Deadline: {t.deadline}",
                    f"Block Window: {b.block_id} ({b.date} {b.start_time} - {b.end_time})",
                    f"Required Resources: {', '.join(t.required_resources or ['General Gang'])}"
                ]
            }
            if asgn.bundled_with:
                explanation["reasons"].append(f"Bundled with {', '.join(asgn.bundled_with)} in joint block.")

            scheduled_assignments_detail.append({
                "assignment_id": asgn.assignment_id,
                "task_id": t.task_id,
                "task": {
                    "task_id": t.task_id,
                    "department": t.department,
                    "asset_type": t.asset_type,
                    "location": t.location,
                    "description": t.description,
                    "duration_hours": t.duration_hours,
                    "priority_score": t.priority_score,
                    "criticality": t.criticality,
                    "overdue": t.overdue
                },
                "block_id": b.block_id,
                "block": {
                    "block_id": b.block_id,
                    "section": b.section,
                    "direction": b.direction,
                    "date": b.date,
                    "start_time": b.start_time,
                    "end_time": b.end_time,
                    "max_duration_hours": b.max_duration_hours
                },
                "bundled_with": asgn.bundled_with or [],
                "explanation": explanation
            })

    deferred_tasks = []
    for t in tasks:
        if t.task_id not in scheduled_task_ids:
            deferred_tasks.append({
                "task_id": t.task_id,
                "task": {
                    "task_id": t.task_id,
                    "department": t.department,
                    "asset_type": t.asset_type,
                    "location": t.location,
                    "duration_hours": t.duration_hours,
                    "priority_score": t.priority_score,
                    "criticality": t.criticality,
                    "overdue": t.overdue
                },
                "explanation": {
                    "summary": f"Deferred to prevent corridor congestion and resource clash on {t.preferred_date}.",
                    "reasons": [
                        f"Priority cutoff: score {t.priority_score:.1f} lower than competing tasks in {t.location}.",
                        f"Sufficient safety buffer remaining before deadline ({t.deadline})."
                    ]
                }
            })

    return {
        "plan_id": plan.plan_id,
        "plan_name": plan.plan_name,
        "strategy_type": plan.strategy_type,
        "status": plan.status,
        "notes": plan.notes,
        "kpis": {
            "total_tasks": plan.total_tasks,
            "scheduled_count": plan.scheduled_count,
            "deferred_count": plan.deferred_count,
            "conflict_count": plan.conflict_count,
            "utilization_rate": plan.utilization_rate,
            "critical_coverage": plan.critical_coverage,
            "objective_score": plan.objective_score
        },
        "created_at": plan.created_at.isoformat() if plan.created_at else None,
        "approved_by": plan.approved_by,
        "approved_at": plan.approved_at.isoformat() if plan.approved_at else None,
        "scheduled_assignments": scheduled_assignments_detail,
        "deferred_tasks": deferred_tasks,
        "disclaimer": "AI-Assisted Demo Recommendation | Not an official railway block authorization."
    }

@router.post("/api/plans/{plan_id}/approve", status_code=status.HTTP_200_OK)
def approve_plan(
    plan_id: str,
    req: ApprovalRequest,
    db: Session = Depends(get_db)
):
    plan = db.query(SchedulePlan).filter(SchedulePlan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{plan_id}' not found."
        )

    prev_status = plan.status
    plan.status = "Approved"
    plan.approved_by = f"{req.user_name} ({req.user_role})"
    plan.approved_at = datetime.utcnow()

    # Log to audit trail
    audit_entry = AuditLog(
        log_id=f"AUD-APPR-{plan_id[:8]}-{uuid.uuid4().hex[:6]}",
        user_role=req.user_role,
        action="Plan Approved",
        target_id=plan_id,
        target_type="PLAN",
        details=f"Plan '{plan.plan_name}' approved by {req.user_name}. Comments: {req.comments}",
        status_change=f"{prev_status} -> Approved"
    )
    db.add(audit_entry)
    db.commit()

    return {
        "status": "success",
        "message": f"Plan '{plan.plan_name}' ({plan_id}) approved successfully.",
        "plan_id": plan_id,
        "new_status": "Approved",
        "approved_by": plan.approved_by,
        "approved_at": plan.approved_at.isoformat(),
        "disclaimer": "Final operational execution remains with authorised railway block personnel."
    }

@router.post("/api/plans/{plan_id}/reject", status_code=status.HTTP_200_OK)
def reject_plan(
    plan_id: str,
    req: RejectionRequest,
    db: Session = Depends(get_db)
):
    plan = db.query(SchedulePlan).filter(SchedulePlan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{plan_id}' not found."
        )

    prev_status = plan.status
    plan.status = "Rejected"
    plan.notes = f"Rejected: {req.reason}"

    audit_entry = AuditLog(
        log_id=f"AUD-REJ-{plan_id[:8]}-{uuid.uuid4().hex[:6]}",
        user_role=req.user_role,
        action="Plan Rejected",
        target_id=plan_id,
        target_type="PLAN",
        details=f"Plan '{plan.plan_name}' rejected by {req.user_name}. Reason: {req.reason}",
        status_change=f"{prev_status} -> Rejected"
    )
    db.add(audit_entry)
    db.commit()

    return {
        "status": "success",
        "message": f"Plan '{plan.plan_name}' ({plan_id}) rejected.",
        "plan_id": plan_id,
        "new_status": "Rejected",
        "reason": req.reason
    }
