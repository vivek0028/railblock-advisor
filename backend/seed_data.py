import json
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import engine, SessionLocal, Base
from app.models.models import (
    MaintenanceTask,
    TrainMovement,
    BlockWindow,
    Resource,
    DataSource,
    AuditLog
)
from app.services.priority_engine import calculate_priority_score
from app.adapters.bdms_adapter import get_data_dir

def seed_database(force: bool = False):
    """
    Seeds the SQLite database with deterministic Indian Railways synthetic data.
    Only seeds if tables are empty, unless force=True.
    """
    # 1. Ensure all tables are created
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    data_dir = get_data_dir()
    
    try:
        tasks_count = db.query(MaintenanceTask).count()
        if tasks_count > 0 and not force:
            print(f"[SEED] Database already contains {tasks_count} maintenance tasks. Skipping seeding.")
            return

        print("[SEED] Starting database initialization with synthetic demo data...")

        # 2. Seed Maintenance Tasks
        tasks_file = data_dir / "maintenance_tasks.json"
        if tasks_file.exists():
            with open(tasks_file, "r", encoding="utf-8") as f:
                tasks_raw = json.load(f)
                for item in tasks_raw:
                    score, factors, _ = calculate_priority_score(
                        criticality=item["criticality"],
                        deadline_str=item["deadline"],
                        overdue=item.get("overdue", False),
                        asset_type=item["asset_type"],
                        preferred_date_str=item["preferred_date"]
                    )
                    task = MaintenanceTask(
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
                        defect_code=item.get("defect_code"),
                        data_label="DEMO DATA"
                    )
                    db.merge(task)
            print(f"[SEED] Seeded {len(tasks_raw)} Maintenance Tasks.")

        # 3. Seed Train Movements
        trains_file = data_dir / "train_movements.json"
        if trains_file.exists():
            with open(trains_file, "r", encoding="utf-8") as f:
                trains_raw = json.load(f)
                for item in trains_raw:
                    train = TrainMovement(
                        train_no=item["train_no"],
                        train_name=item["train_name"],
                        train_type=item["train_type"],
                        section=item["section"],
                        direction=item["direction"],
                        scheduled_departure=item["scheduled_departure"],
                        scheduled_arrival=item["scheduled_arrival"],
                        priority_rank=item.get("priority_rank", 2),
                        speed_kmph=float(item.get("speed_kmph", 100.0)),
                        data_label="DEMO DATA"
                    )
                    db.merge(train)
            print(f"[SEED] Seeded {len(trains_raw)} Train Movements.")

        # 4. Seed Block Windows
        blocks_file = data_dir / "block_windows.json"
        if blocks_file.exists():
            with open(blocks_file, "r", encoding="utf-8") as f:
                blocks_raw = json.load(f)
                for item in blocks_raw:
                    block = BlockWindow(
                        block_id=item["block_id"],
                        section=item["section"],
                        direction=item["direction"],
                        date=item["date"],
                        start_time=item["start_time"],
                        end_time=item["end_time"],
                        max_duration_hours=float(item["max_duration_hours"]),
                        status=item.get("status", "Available"),
                        corridor_name=item.get("corridor_name", "Mainline Corridor Alpha"),
                        data_label="DEMO DATA"
                    )
                    db.merge(block)
            print(f"[SEED] Seeded {len(blocks_raw)} Block Windows.")

        # 5. Seed Resources
        res_file = data_dir / "resources.json"
        if res_file.exists():
            with open(res_file, "r", encoding="utf-8") as f:
                res_raw = json.load(f)
                for item in res_raw:
                    res = Resource(
                        resource_id=item["resource_id"],
                        name=item["name"],
                        resource_type=item["resource_type"],
                        department=item["department"],
                        home_depot=item["home_depot"],
                        available=bool(item.get("available", True)),
                        data_label="DEMO DATA"
                    )
                    db.merge(res)
            print(f"[SEED] Seeded {len(res_raw)} Resources.")

        # 6. Seed Data Sources
        sources = [
            {
                "source_id": "SRC-BDMS",
                "name": "BDMS",
                "full_name": "Block Demanding and Monitoring System",
                "system_type": "Maintenance Block Requisition",
                "status": "Connected (Demo Mode)",
                "last_sync": "2026-09-17T10:00:00",
                "record_count": 24,
                "description": "Cross-departmental maintenance disconnection demands."
            },
            {
                "source_id": "SRC-TMS",
                "name": "TMS",
                "full_name": "Track Management System",
                "system_type": "Civil Engineering & Permanent Way",
                "status": "Connected (Demo Mode)",
                "last_sync": "2026-09-17T09:30:00",
                "record_count": 9,
                "description": "Rail inspection, ultrasonic testing, deep screening, and tamping records."
            },
            {
                "source_id": "SRC-SMMS",
                "name": "SMMS",
                "full_name": "Signalling & Telecom Maintenance Management System",
                "system_type": "Signalling, Interlocking & Telecom",
                "status": "Connected (Demo Mode)",
                "last_sync": "2026-09-17T09:45:00",
                "record_count": 8,
                "description": "Point machines, axle counters, track circuits, and OFC telemetry."
            },
            {
                "source_id": "SRC-TDMS",
                "name": "TDMS",
                "full_name": "Traction Distribution Maintenance System",
                "system_type": "Overhead Equipment (OHE) Electrification",
                "status": "Connected (Demo Mode)",
                "last_sync": "2026-09-17T09:50:00",
                "record_count": 7,
                "description": "Contact wire wear, insulator washing, and power switching blocks."
            },
            {
                "source_id": "SRC-COA",
                "name": "COA",
                "full_name": "Control Office Application",
                "system_type": "Section Train Movement Timetable",
                "status": "Connected (Demo Mode)",
                "last_sync": "2026-09-17T10:15:00",
                "record_count": 20,
                "description": "Real-time timetable graphs, sectional speed restrictions, and path conflicts."
            },
            {
                "source_id": "SRC-GOODS",
                "name": "GOODS_FORECAST",
                "full_name": "Freight Operations Information System (FOIS)",
                "system_type": "Freight Traffic Flow & Demand Forecast",
                "status": "Connected (Demo Mode)",
                "last_sync": "2026-09-17T10:20:00",
                "record_count": 2,
                "description": "Bulk coal and container rake movement projections."
            }
        ]
        for s in sources:
            ds = DataSource(
                source_id=s["source_id"],
                name=s["name"],
                full_name=s["full_name"],
                system_type=s["system_type"],
                status=s["status"],
                last_sync=s["last_sync"],
                record_count=s["record_count"],
                description=s["description"],
                data_label="DEMO DATA"
            )
            db.merge(ds)
        print(f"[SEED] Seeded {len(sources)} Data Sources.")

        # 7. Seed initial Audit Log
        initial_log = AuditLog(
            log_id="AUD-INIT-001",
            user_role="System",
            action="Database Initialized",
            target_id="SYSTEM",
            target_type="SYSTEM",
            details="Seeded initial synthetic railway dataset for Corridor Alpha (Section A-B, B-C, C-D).",
            data_label="DEMO DATA"
        )
        db.merge(initial_log)

        db.commit()
        print("[SEED] Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] Failed to seed database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force=True)
