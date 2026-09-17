from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON
from app.database import Base

class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    task_id = Column(String(50), primary_key=True, index=True)
    department = Column(String(50), nullable=False, index=True)  # Engineering, S&T, Traction
    asset_type = Column(String(50), nullable=False)  # Track, Signal, OHE, Bridge, Telecom, Point Machine
    location = Column(String(100), nullable=False, index=True)  # Section A-B, Section B-C, Section C-D
    description = Column(Text, nullable=False)
    duration_hours = Column(Float, nullable=False)
    preferred_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    deadline = Column(String(20), nullable=False)  # YYYY-MM-DD
    criticality = Column(String(20), nullable=False, default="Medium")  # Critical, High, Medium, Low
    overdue = Column(Boolean, default=False)
    
    # JSON columns
    required_resources = Column(JSON, default=list)  # List[str]
    dependencies = Column(JSON, default=list)  # List[str]
    compatible_departments = Column(JSON, default=list)  # List[str]
    priority_factors = Column(JSON, default=dict)  # breakdown of factors

    priority_score = Column(Float, default=0.0)
    status = Column(String(30), default="Pending")  # Pending, Scheduled, Deferred, In_Progress, Completed
    assigned_block_id = Column(String(50), nullable=True)
    data_source = Column(String(50), default="BDMS")
    data_label = Column(String(50), default="DEMO DATA")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TrainMovement(Base):
    __tablename__ = "train_movements"

    train_no = Column(String(50), primary_key=True, index=True)
    train_name = Column(String(100), nullable=False)
    train_type = Column(String(50), nullable=False)  # Premium Express, Superfast, Freight, Passenger
    section = Column(String(100), nullable=False, index=True)
    direction = Column(String(20), nullable=False)  # UP, DOWN
    scheduled_departure = Column(String(30), nullable=False)  # ISO datetime string
    scheduled_arrival = Column(String(30), nullable=False)    # ISO datetime string
    priority_rank = Column(Integer, default=2)  # 1 (Highest, e.g. Vande Bharat/Rajdhani) to 4 (Freight)
    speed_kmph = Column(Float, default=100.0)
    data_label = Column(String(50), default="DEMO DATA")


class BlockWindow(Base):
    __tablename__ = "block_windows"

    block_id = Column(String(50), primary_key=True, index=True)
    section = Column(String(100), nullable=False, index=True)
    direction = Column(String(20), nullable=False)  # UP, DOWN, BOTH
    date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    start_time = Column(String(20), nullable=False)  # HH:MM:SS
    end_time = Column(String(20), nullable=False)    # HH:MM:SS
    max_duration_hours = Column(Float, nullable=False)
    status = Column(String(30), default="Available")  # Available, Reserved, Cancelled
    corridor_name = Column(String(100), default="Mainline Corridor Alpha")
    data_label = Column(String(50), default="DEMO DATA")


class Resource(Base):
    __tablename__ = "resources"

    resource_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False)
    home_depot = Column(String(100), nullable=False)
    available = Column(Boolean, default=True)
    data_label = Column(String(50), default="DEMO DATA")


class SchedulePlan(Base):
    __tablename__ = "schedule_plans"

    plan_id = Column(String(50), primary_key=True, index=True)
    plan_name = Column(String(100), nullable=False)
    strategy_type = Column(String(50), nullable=False)  # PLAN_A_CRITICAL, PLAN_B_TRAIN_IMPACT, PLAN_C_BUNDLING, SIMULATION
    total_tasks = Column(Integer, default=0)
    scheduled_count = Column(Integer, default=0)
    deferred_count = Column(Integer, default=0)
    conflict_count = Column(Integer, default=0)
    utilization_rate = Column(Float, default=0.0)
    critical_coverage = Column(Float, default=0.0)
    objective_score = Column(Float, default=0.0)
    status = Column(String(30), default="Generated")  # Draft, Generated, Under Review, Approved, Rejected, Modified
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    data_label = Column(String(50), default="DEMO DATA")


class ScheduleAssignment(Base):
    __tablename__ = "schedule_assignments"

    assignment_id = Column(String(50), primary_key=True, index=True)
    plan_id = Column(String(50), nullable=False, index=True)
    task_id = Column(String(50), nullable=False, index=True)
    block_id = Column(String(50), nullable=False, index=True)
    start_time = Column(String(30), nullable=True)
    end_time = Column(String(30), nullable=True)
    bundled_with = Column(JSON, default=list)  # List[task_id]
    explanation = Column(Text, nullable=True)
    data_label = Column(String(50), default="DEMO DATA")


class Conflict(Base):
    __tablename__ = "conflicts"

    conflict_id = Column(String(50), primary_key=True, index=True)
    conflict_type = Column(String(50), nullable=False)  # Timetable, Resource, Location, Dependency, Duration
    severity = Column(String(20), nullable=False)       # Critical, Warning, Attention, Resolved
    affected_tasks = Column(JSON, default=list)        # List[task_id]
    affected_trains = Column(JSON, default=list)       # List[train_no]
    explanation = Column(Text, nullable=False)
    suggested_resolution = Column(Text, nullable=False)
    status = Column(String(30), default="Active")       # Active, Resolved, Ignored
    created_at = Column(DateTime, default=datetime.utcnow)
    data_label = Column(String(50), default="DEMO DATA")


class PlannerDecision(Base):
    __tablename__ = "planner_decisions"

    decision_id = Column(String(50), primary_key=True, index=True)
    plan_id = Column(String(50), nullable=False, index=True)
    task_id = Column(String(50), nullable=True)
    action = Column(String(50), nullable=False)  # Approve, Reject, Modify, Override, Comment
    justification = Column(Text, nullable=False)
    planner_role = Column(String(50), default="Planner")  # Planner, Reviewer, Administrator
    timestamp = Column(DateTime, default=datetime.utcnow)
    data_label = Column(String(50), default="DEMO DATA")


class DataSource(Base):
    __tablename__ = "data_sources"

    source_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(50), nullable=False)            # BDMS, TMS, SMMS, TDMS, COA, GOODS_FORECAST
    full_name = Column(String(100), nullable=False)
    system_type = Column(String(100), nullable=False)
    status = Column(String(50), default="Connected (Demo Mode)")
    last_sync = Column(String(30), nullable=False)
    record_count = Column(Integer, default=0)
    description = Column(Text, nullable=False)
    data_label = Column(String(50), default="DEMO DATA")


class AuditLog(Base):
    """
    Append-Only Audit Trail: The audit trail records approval and workflow events for the prototype.
    """
    __tablename__ = "audit_logs"

    log_id = Column(String(50), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_role = Column(String(50), default="Planner")    # Planner, Reviewer, Administrator
    action = Column(String(100), nullable=False)         # Plan Generated, Task Added, Plan Approved, etc.
    target_id = Column(String(50), nullable=False)
    target_type = Column(String(50), nullable=False)     # TASK, PLAN, BLOCK, CONFLICT
    details = Column(Text, nullable=False)
    status_change = Column(String(100), nullable=True)   # e.g., "Draft -> Approved"
    data_label = Column(String(50), default="DEMO DATA")
