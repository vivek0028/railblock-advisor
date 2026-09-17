import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import MaintenanceTask, AuditLog
from app.schemas.schemas import (
    MaintenanceTaskCreate,
    MaintenanceTaskUpdate,
    MaintenanceTaskResponse
)
from app.services.priority_engine import calculate_priority_score
from app.adapters.bdms_adapter import get_data_dir

router = APIRouter(prefix="/api/tasks", tags=["Maintenance Tasks"])

@router.get("", response_model=List[MaintenanceTaskResponse])
def get_all_tasks(
    department: Optional[str] = Query(None, description="Filter by department (Engineering, S&T, Traction)"),
    status: Optional[str] = Query(None, description="Filter by status (Pending, Scheduled, Deferred, etc.)"),
    location: Optional[str] = Query(None, description="Filter by section location"),
    criticality: Optional[str] = Query(None, description="Filter by criticality level"),
    overdue: Optional[bool] = Query(None, description="Filter by overdue status"),
    db: Session = Depends(get_db)
):
    query = db.query(MaintenanceTask)
    if department:
        query = query.filter(MaintenanceTask.department == department)
    if status:
        query = query.filter(MaintenanceTask.status == status)
    if location:
        query = query.filter(MaintenanceTask.location == location)
    if criticality:
        query = query.filter(MaintenanceTask.criticality == criticality)
    if overdue is not None:
        query = query.filter(MaintenanceTask.overdue == overdue)
    
    tasks = query.order_by(MaintenanceTask.priority_score.desc()).all()
    return tasks

@router.get("/{task_id}", response_model=MaintenanceTaskResponse)
def get_task_by_id(task_id: str, db: Session = Depends(get_db)):
    task = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance task with ID '{task_id}' was not found in the database."
        )
    return task

@router.post("", response_model=MaintenanceTaskResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_task(task_in: MaintenanceTaskCreate, db: Session = Depends(get_db)):
    # 1. Check duplicate task_id
    existing = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_in.task_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Task ID '{task_in.task_id}' already exists. Duplicate task IDs are not allowed."
        )

    # 2. Calculate rule-based priority score
    score, factors, _ = calculate_priority_score(
        criticality=task_in.criticality,
        deadline_str=task_in.deadline,
        overdue=task_in.overdue,
        asset_type=task_in.asset_type,
        preferred_date_str=task_in.preferred_date
    )

    # 3. Create ORM instance
    db_task = MaintenanceTask(
        task_id=task_in.task_id,
        department=task_in.department,
        asset_type=task_in.asset_type,
        location=task_in.location,
        description=task_in.description,
        duration_hours=task_in.duration_hours,
        preferred_date=task_in.preferred_date,
        deadline=task_in.deadline,
        criticality=task_in.criticality,
        overdue=task_in.overdue,
        required_resources=task_in.required_resources,
        dependencies=task_in.dependencies,
        compatible_departments=task_in.compatible_departments,
        status=task_in.status,
        priority_score=score,
        priority_factors=factors,
        data_source="BDMS",
        data_label="DEMO DATA"
    )
    db.add(db_task)

    # 4. Record audit log
    audit_entry = AuditLog(
        log_id=f"AUD-NEW-{uuid.uuid4().hex[:8]}",
        user_role="Planner",
        action="Task Created",
        target_id=db_task.task_id,
        target_type="TASK",
        details=f"Created maintenance request {db_task.task_id} for {db_task.department} on {db_task.location} with priority score {score}."
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(db_task)
    return db_task

@router.put("/{task_id}", response_model=MaintenanceTaskResponse)
def update_maintenance_task(task_id: str, task_in: MaintenanceTaskUpdate, db: Session = Depends(get_db)):
    task = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance task with ID '{task_id}' was not found in the database."
        )

    # Update provided fields
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    # Recalculate priority if priority-affecting fields were changed
    score, factors, _ = calculate_priority_score(
        criticality=task.criticality,
        deadline_str=task.deadline,
        overdue=task.overdue,
        asset_type=task.asset_type,
        preferred_date_str=task.preferred_date
    )
    task.priority_score = score
    task.priority_factors = factors

    audit_entry = AuditLog(
        log_id=f"AUD-UPD-{uuid.uuid4().hex[:8]}",
        user_role="Planner",
        action="Task Updated",
        target_id=task.task_id,
        target_type="TASK",
        details=f"Updated task {task.task_id}. New status: {task.status}, priority score: {score}."
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
def delete_maintenance_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Maintenance task with ID '{task_id}' was not found in the database."
        )

    db.delete(task)
    audit_entry = AuditLog(
        log_id=f"AUD-DEL-{uuid.uuid4().hex[:8]}",
        user_role="Planner",
        action="Task Deleted",
        target_id=task_id,
        target_type="TASK",
        details=f"Deleted maintenance request {task_id}."
    )
    db.add(audit_entry)
    db.commit()

    return {
        "status": "success",
        "message": f"Maintenance task '{task_id}' successfully deleted.",
        "task_id": task_id
    }

@router.post("/import-demo", status_code=status.HTTP_200_OK)
def import_demo_tasks(db: Session = Depends(get_db)):
    """
    Reloads or refreshes synthetic demo maintenance tasks from local data file.
    """
    file_path = get_data_dir() / "maintenance_tasks.json"
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Demo maintenance tasks file not found at {file_path}."
        )

    with open(file_path, "r", encoding="utf-8") as f:
        tasks_data = json.load(f)

    imported_count = 0
    updated_count = 0

    for item in tasks_data:
        score, factors, _ = calculate_priority_score(
            criticality=item["criticality"],
            deadline_str=item["deadline"],
            overdue=item.get("overdue", False),
            asset_type=item["asset_type"],
            preferred_date_str=item["preferred_date"]
        )

        existing = db.query(MaintenanceTask).filter(MaintenanceTask.task_id == item["task_id"]).first()
        if existing:
            for k, v in item.items():
                setattr(existing, k, v)
            existing.priority_score = score
            existing.priority_factors = factors
            updated_count += 1
        else:
            new_task = MaintenanceTask(
                task_id=item["task_id"],
                department=item["department"],
                asset_type=item["asset_type"],
                location=item["location"],
                description=item["description"],
                duration_hours=float(item["duration_hours"]),
                preferred_date=item["preferred_date"],
                deadline=item["deadline"],
                criticality=item["criticality"],
                overdue=bool(item.get("overdue", False)),
                required_resources=item.get("required_resources", []),
                dependencies=item.get("dependencies", []),
                compatible_departments=item.get("compatible_departments", []),
                status=item.get("status", "Pending"),
                priority_score=score,
                priority_factors=factors,
                data_source=item.get("data_source", "BDMS"),
                data_label="DEMO DATA"
            )
            db.add(new_task)
            imported_count += 1

    db.commit()

    return {
        "status": "success",
        "message": "Demo maintenance tasks successfully synchronized.",
        "records_imported": imported_count,
        "records_updated": updated_count,
        "total_active": imported_count + updated_count,
        "data_label": "DEMO DATA"
    }

# Alias router for /api/requests -> Maintenance Tasks
requests_router = APIRouter(prefix="/api/requests", tags=["Maintenance Requests"])

@requests_router.get("", response_model=List[MaintenanceTaskResponse])
def get_all_requests_alias(
    department: Optional[str] = Query(None, description="Filter by department (Engineering, S&T, Traction)"),
    status: Optional[str] = Query(None, description="Filter by status (Pending, Scheduled, Deferred, etc.)"),
    location: Optional[str] = Query(None, description="Filter by section location"),
    criticality: Optional[str] = Query(None, description="Filter by criticality level"),
    overdue: Optional[bool] = Query(None, description="Filter by overdue status"),
    db: Session = Depends(get_db)
):
    return get_all_tasks(department, status, location, criticality, overdue, db)

