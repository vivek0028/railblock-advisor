import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Conflict, AuditLog
from app.services.conflict_engine import detect_all_conflicts

from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/api/conflicts", tags=["Conflict Detection"])

class ConflictResolveRequest(BaseModel):
    resolution_strategy: Optional[str] = "PLAN_B_TRAIN_IMPACT"
    applied_plan_id: Optional[str] = None
    resolution_notes: Optional[str] = None

@router.get("")
def get_conflicts(
    severity: Optional[str] = Query(None, description="Filter by severity (Critical, Warning, Attention)"),
    conflict_type: Optional[str] = Query(None, description="Filter by conflict type (Timetable, Resource, Location, Dependency, Duration)"),
    status: Optional[str] = Query(None, description="Filter by status (Active, Resolved)"),
    db: Session = Depends(get_db)
):
    query = db.query(Conflict)
    if severity:
        query = query.filter(Conflict.severity == severity)
    if conflict_type:
        query = query.filter(Conflict.conflict_type == conflict_type)
    if status:
        query = query.filter(Conflict.status == status)
    
    conflicts = query.all()
    if not conflicts:
        # If DB has no conflicts yet, run detection on the fly
        conflicts_data = detect_all_conflicts(db, persist=True)
        return conflicts_data

    return [
        {
            "conflict_id": c.conflict_id,
            "conflict_type": c.conflict_type,
            "severity": c.severity,
            "affected_tasks": c.affected_tasks or [],
            "affected_trains": c.affected_trains or [],
            "explanation": c.explanation,
            "suggested_resolution": c.suggested_resolution,
            "status": c.status,
            "resolution_strategy": getattr(c, "resolution_strategy", None),
            "resolved_at": getattr(c, "resolved_at", None).isoformat() if getattr(c, "resolved_at", None) else None,
            "resolution_notes": getattr(c, "resolution_notes", None),
            "data_label": "DEMO DATA"
        }
        for c in conflicts
    ]

@router.patch("/{conflict_id}/resolve", status_code=status.HTTP_200_OK)
def resolve_conflict(
    conflict_id: str,
    req: ConflictResolveRequest,
    db: Session = Depends(get_db)
):
    """
    Marks a specific conflict as Resolved, recording the optimization plan / strategy applied.
    """
    conflict = db.query(Conflict).filter(Conflict.conflict_id == conflict_id).first()
    if not conflict:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Conflict {conflict_id} not found")

    conflict.status = "Resolved"
    conflict.resolution_strategy = req.resolution_strategy
    conflict.resolved_at = datetime.utcnow()
    conflict.resolution_notes = req.resolution_notes or f"Resolved via {req.resolution_strategy}"

    # If applied_plan_id was provided, commit that plan to master schedule
    if req.applied_plan_id:
        try:
            from app.services.plan_committer import commit_approved_plan_schedule
            commit_approved_plan_schedule(
                plan_id=req.applied_plan_id,
                db=db,
                user_name="Chief Controller (COA)",
                user_role="Operational Controller",
                comments=req.resolution_notes or f"Applied to resolve conflict {conflict_id} via strategy {req.resolution_strategy}"
            )
        except Exception as e:
            print(f"Warning: Could not commit schedule for {req.applied_plan_id}: {e}")

    # Log to audit trail
    audit_entry = AuditLog(
        log_id=f"AUD-RES-{uuid.uuid4().hex[:8]}",
        user_role="Chief Controller",
        action="Conflict Resolved",
        target_id=conflict_id,
        target_type="CONFLICT",
        details=f"Conflict {conflict_id} marked Resolved via strategy: {req.resolution_strategy}. Plan applied: {req.applied_plan_id or 'N/A'}."
    )
    db.add(audit_entry)
    db.commit()

    return {
        "status": "success",
        "conflict_id": conflict_id,
        "new_status": "Resolved",
        "resolution_strategy": conflict.resolution_strategy,
        "resolved_at": conflict.resolved_at.isoformat() if conflict.resolved_at else None,
        "message": f"Conflict {conflict_id} successfully resolved with {conflict.resolution_strategy}"
    }

@router.patch("/{conflict_id}/reopen", status_code=status.HTTP_200_OK)
def reopen_conflict(
    conflict_id: str,
    db: Session = Depends(get_db)
):
    """
    Reopens a previously resolved conflict back to Active status.
    """
    conflict = db.query(Conflict).filter(Conflict.conflict_id == conflict_id).first()
    if not conflict:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Conflict {conflict_id} not found")

    conflict.status = "Active"
    conflict.resolution_strategy = None
    conflict.resolved_at = None
    conflict.resolution_notes = "Reopened by Chief Controller for re-evaluation"

    audit_entry = AuditLog(
        log_id=f"AUD-REOPEN-{uuid.uuid4().hex[:8]}",
        user_role="Chief Controller",
        action="Conflict Reopened",
        target_id=conflict_id,
        target_type="CONFLICT",
        details=f"Conflict {conflict_id} reopened to Active status."
    )
    db.add(audit_entry)
    db.commit()

    return {
        "status": "success",
        "conflict_id": conflict_id,
        "new_status": "Active",
        "message": f"Conflict {conflict_id} reopened to Active status"
    }

@router.post("/detect", status_code=status.HTTP_200_OK)
def trigger_conflict_detection(db: Session = Depends(get_db)):
    """
    Executes the multi-factor conflict detection engine across current timetable and maintenance demands.
    """
    detected = detect_all_conflicts(db, persist=True)

    # Log to audit trail
    audit_entry = AuditLog(
        log_id=f"AUD-CONF-{uuid.uuid4().hex[:8]}",
        user_role="Planner",
        action="Conflict Detection Run",
        target_id="SYSTEM",
        target_type="CONFLICT",
        details=f"Conflict detection triggered. {len(detected)} operational conflicts identified across corridor."
    )
    db.add(audit_entry)
    db.commit()

    active_detected = [c for c in detected if c.get("status") != "Resolved"]
    resolved_detected = [c for c in detected if c.get("status") == "Resolved"]

    return {
        "status": "success",
        "total_conflicts_detected": len(active_detected),
        "total_resolved": len(resolved_detected),
        "conflicts": detected,
        "summary": {
            "critical_count": sum(1 for c in active_detected if c["severity"] == "Critical"),
            "warning_count": sum(1 for c in active_detected if c["severity"] == "Warning"),
            "timetable_count": sum(1 for c in active_detected if c["conflict_type"] == "Timetable"),
            "resource_count": sum(1 for c in active_detected if c["conflict_type"] == "Resource"),
            "location_count": sum(1 for c in active_detected if c["conflict_type"] == "Location"),
            "dependency_count": sum(1 for c in active_detected if c["conflict_type"] == "Dependency"),
            "duration_count": sum(1 for c in active_detected if c["conflict_type"] == "Duration")
        },
        "disclaimer": "AI-Assisted Conflict Detection | Decision Support for Indian Railways Planners"
    }
