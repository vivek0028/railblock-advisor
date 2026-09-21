from datetime import datetime
import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import (
    SchedulePlan,
    ScheduleAssignment,
    MaintenanceTask,
    BlockWindow,
    Conflict,
    AuditLog
)

def commit_approved_plan_schedule(
    plan_id: str,
    db: Session,
    user_name: str = "Chief Controller (COA)",
    user_role: str = "Operational Controller",
    comments: Optional[str] = "Plan approved and committed to master corridor timetable."
) -> SchedulePlan:
    """
    Commits an approved optimization plan to the application's schedule data.
    Ensures that:
    1. The target plan status is set to 'Approved' with authorizer name, timestamp, and notes.
    2. Any other plan previously marked 'Approved' is marked 'Superseded' so only one master approved timetable exists.
    3. All tasks assigned in this plan have their database record updated:
       - status = 'Approved'
       - assigned_block_id = asgn.block_id
       - preferred_date = block.date (synchronized to scheduled date)
       - location = block.section
    4. All corresponding block windows have their status set to 'Approved' and time boundaries updated.
    5. Active conflicts that are deconflicted by this plan are marked 'Resolved'.
    6. An immutable AuditLog entry is committed.
    """
    plan = db.query(SchedulePlan).filter(SchedulePlan.plan_id == plan_id).first()
    if not plan:
        raise ValueError(f"Plan '{plan_id}' not found.")

    prev_status = plan.status

    # 1. Supersede any previously approved plan
    prev_approved_plans = db.query(SchedulePlan).filter(
        SchedulePlan.status == "Approved",
        SchedulePlan.plan_id != plan_id
    ).all()
    for p in prev_approved_plans:
        p.status = "Superseded"

    # 2. Mark this plan as Approved
    plan.status = "Approved"
    authorizer_str = f"{user_name} ({user_role})" if user_role not in user_name else user_name
    plan.approved_by = authorizer_str
    plan.approved_at = datetime.utcnow()
    if comments:
        plan.notes = f"{plan.notes or ''} | Approved: {comments}".strip(" |")

    # 3. Retrieve all schedule assignments for this plan
    assignments = db.query(ScheduleAssignment).filter(ScheduleAssignment.plan_id == plan_id).all()
    scheduled_task_ids = set()

    for asgn in assignments:
        scheduled_task_ids.add(asgn.task_id)
        task = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == asgn.task_id).first()
        block = db.query(BlockWindow).filter(BlockWindow.block_id == asgn.block_id).first()

        if block:
            block.status = "Approved"
            if asgn.start_time and asgn.end_time:
                block.start_time = asgn.start_time
                block.end_time = asgn.end_time

        if task:
            task.status = "Approved"
            task.assigned_block_id = asgn.block_id
            if block:
                task.preferred_date = block.date
                task.location = block.section

    # 4. Update any maintenance tasks not scheduled in this approved plan
    all_tasks = db.query(MaintenanceTask).all()
    for t in all_tasks:
        if t.task_id not in scheduled_task_ids:
            if t.status in ["Approved", "Scheduled"]:
                t.status = "Deferred"
                t.assigned_block_id = None

    # 5. Automatically resolve active conflicts whose tasks are safely scheduled
    active_conflicts = db.query(Conflict).filter(Conflict.status == "Active").all()
    for conf in active_conflicts:
        affected = set(conf.affected_tasks or [])
        if affected and affected.issubset(scheduled_task_ids):
            conf.status = "Resolved"
            conf.resolution_strategy = f"{plan.plan_id} ({plan.plan_name})"
            conf.resolved_at = datetime.utcnow()
            conf.resolution_notes = f"Deconflicted and scheduled in approved timetable ({plan.plan_name})."

    # 6. Record in Audit Log
    audit_entry = AuditLog(
        log_id=f"AUD-COMM-{plan_id[:8]}-{uuid.uuid4().hex[:6]}",
        user_role=user_role,
        action="Master Timetable Committed",
        target_id=plan_id,
        target_type="PLAN",
        details=f"Approved plan '{plan.plan_name}' ({plan_id}) committed to master Weekly & Monthly timetable by {user_name}. {len(assignments)} tasks and block windows synchronized.",
        status_change=f"{prev_status} -> Approved"
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(plan)

    return plan

def clear_approved_plan_schedule(
    db: Session,
    plan_id: Optional[str] = None,
    user_name: str = "Chief Controller (COA)",
    user_role: str = "Operational Controller"
) -> dict:
    """
    Clears any approved timetable plan and resets tasks, blocks, and plans back to draft/generated status.
    """
    query = db.query(SchedulePlan)
    if plan_id:
        plans = query.filter(SchedulePlan.plan_id == plan_id).all()
    else:
        plans = query.filter(SchedulePlan.status.in_(["Approved", "Superseded"])).all()

    cleared_plan_ids = []
    for p in plans:
        prev_status = p.status
        p.status = "Generated"
        p.approved_by = None
        p.approved_at = None
        cleared_plan_ids.append(p.plan_id)

    # Reset tasks that were marked Approved or Deferred
    tasks = db.query(MaintenanceTask).filter(MaintenanceTask.status.in_(["Approved", "Deferred"])).all()
    for t in tasks:
        t.status = "Pending"
        t.assigned_block_id = None

    # Reset block windows marked Approved
    blocks = db.query(BlockWindow).filter(BlockWindow.status == "Approved").all()
    for b in blocks:
        b.status = "Available"

    # Audit log entry
    audit_entry = AuditLog(
        log_id=f"AUD-CLR-{uuid.uuid4().hex[:8]}",
        user_role=user_role,
        action="Master Timetable Approval Cleared",
        target_id=plan_id or "ALL_APPROVED",
        target_type="PLAN",
        details=f"Cleared approved status for plans: {cleared_plan_ids}. All tasks reset to Pending and block windows to Available by {user_name}.",
        status_change="Approved -> Generated"
    )
    db.add(audit_entry)
    db.commit()

    return {
        "status": "success",
        "message": "Approved timetable cleared. Tasks and block windows returned to unallocated state.",
        "cleared_plans": cleared_plan_ids,
        "reset_tasks_count": len(tasks),
        "reset_blocks_count": len(blocks)
    }
