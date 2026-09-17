import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Conflict, AuditLog
from app.services.conflict_engine import detect_all_conflicts

router = APIRouter(prefix="/api/conflicts", tags=["Conflict Detection"])

@router.get("")
def get_conflicts(
    severity: Optional[str] = Query(None, description="Filter by severity (Critical, Warning, Attention)"),
    conflict_type: Optional[str] = Query(None, description="Filter by conflict type (Timetable, Resource, Location, Dependency, Duration)"),
    db: Session = Depends(get_db)
):
    query = db.query(Conflict)
    if severity:
        query = query.filter(Conflict.severity == severity)
    if conflict_type:
        query = query.filter(Conflict.conflict_type == conflict_type)
    
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
            "affected_tasks": c.affected_tasks,
            "affected_trains": c.affected_trains,
            "explanation": c.explanation,
            "suggested_resolution": c.suggested_resolution,
            "status": c.status,
            "data_label": "DEMO DATA"
        }
        for c in conflicts
    ]

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

    return {
        "status": "success",
        "total_conflicts_detected": len(detected),
        "conflicts": detected,
        "summary": {
            "critical_count": sum(1 for c in detected if c["severity"] == "Critical"),
            "warning_count": sum(1 for c in detected if c["severity"] == "Warning"),
            "timetable_count": sum(1 for c in detected if c["conflict_type"] == "Timetable"),
            "resource_count": sum(1 for c in detected if c["conflict_type"] == "Resource"),
            "location_count": sum(1 for c in detected if c["conflict_type"] == "Location"),
            "dependency_count": sum(1 for c in detected if c["conflict_type"] == "Dependency"),
            "duration_count": sum(1 for c in detected if c["conflict_type"] == "Duration")
        },
        "disclaimer": "AI-Assisted Conflict Detection | Decision Support for Indian Railways Planners"
    }
