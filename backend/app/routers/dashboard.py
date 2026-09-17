from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import (
    MaintenanceTask,
    BlockWindow,
    Conflict,
    SchedulePlan,
    AuditLog
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Summary"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    tasks = db.query(MaintenanceTask).all()
    blocks = db.query(BlockWindow).all()
    conflicts = db.query(Conflict).all()
    latest_plan = db.query(SchedulePlan).order_by(SchedulePlan.created_at.desc()).first()
    recent_logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(8).all()

    total_tasks = len(tasks)
    critical_or_high = sum(1 for t in tasks if t.criticality in ["Critical", "High"] or t.overdue)
    active_conflicts = len(conflicts)

    if latest_plan:
        scheduled_tasks = latest_plan.scheduled_count
        deferred_tasks = latest_plan.deferred_count
        utilization_rate = latest_plan.utilization_rate
        critical_coverage = latest_plan.critical_coverage
    else:
        scheduled_tasks = sum(1 for t in tasks if t.status == "Scheduled")
        deferred_tasks = sum(1 for t in tasks if t.status == "Deferred")
        utilization_rate = 65.0
        critical_coverage = 80.0

    # Department breakdown
    dept_counts = {
        "Engineering": sum(1 for t in tasks if t.department == "Engineering"),
        "S&T": sum(1 for t in tasks if t.department == "S&T"),
        "Traction": sum(1 for t in tasks if t.department == "Traction")
    }

    # Priority distribution
    priority_dist = {
        "Critical": sum(1 for t in tasks if t.priority_score >= 80),
        "High": sum(1 for t in tasks if 60 <= t.priority_score < 80),
        "Medium": sum(1 for t in tasks if 35 <= t.priority_score < 60),
        "Low": sum(1 for t in tasks if t.priority_score < 35)
    }

    # Conflict breakdown
    conflict_summary = {
        "total": len(conflicts),
        "critical": sum(1 for c in conflicts if c.severity == "Critical"),
        "warning": sum(1 for c in conflicts if c.severity == "Warning"),
        "timetable": sum(1 for c in conflicts if c.conflict_type == "Timetable"),
        "resource": sum(1 for c in conflicts if c.conflict_type == "Resource"),
        "location": sum(1 for c in conflicts if c.conflict_type == "Location"),
        "dependency": sum(1 for c in conflicts if c.conflict_type == "Dependency"),
        "duration": sum(1 for c in conflicts if c.conflict_type == "Duration")
    }

    # Critical tasks requiring attention (overdue or score >= 80)
    critical_attention = [
        {
            "task_id": t.task_id,
            "department": t.department,
            "asset_type": t.asset_type,
            "location": t.location,
            "description": t.description,
            "priority_score": t.priority_score,
            "deadline": t.deadline,
            "overdue": t.overdue,
            "status": t.status
        }
        for t in sorted(tasks, key=lambda x: x.priority_score, reverse=True)
        if t.overdue or t.priority_score >= 80
    ][:6]

    # Recent activity logs
    activity = [
        {
            "log_id": log.log_id,
            "timestamp": log.timestamp.strftime("%H:%M - %b %d") if log.timestamp else "",
            "user_role": log.user_role,
            "action": log.action,
            "target_id": log.target_id,
            "details": log.details,
            "status_change": log.status_change
        }
        for log in recent_logs
    ]

    return {
        "kpis": {
            "total_maintenance_requests": total_tasks,
            "high_priority_tasks": critical_or_high,
            "conflicts_detected": active_conflicts,
            "scheduled_tasks": scheduled_tasks,
            "deferred_tasks": deferred_tasks,
            "block_utilisation_rate": utilization_rate,
            "critical_task_coverage": critical_coverage
        },
        "department_summary": dept_counts,
        "priority_distribution": priority_dist,
        "conflict_summary": conflict_summary,
        "critical_tasks_requiring_attention": critical_attention,
        "recent_planner_activity": activity,
        "disclaimer": "DEMO DATA | Indian Railways Decision-Support Prototype"
    }
