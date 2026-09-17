from datetime import date
from typing import Dict, Any, Tuple, List
from sqlalchemy.orm import Session
from app.models.models import MaintenanceTask

def calculate_priority_score(
    criticality: str,
    deadline_str: str,
    overdue: bool,
    asset_type: str = "Track",
    preferred_date_str: str = "2026-09-18"
) -> Tuple[float, Dict[str, Any], str]:
    """
    Deterministic rule-based priority scoring engine for Indian Railways maintenance tasks.
    Formula:
    Criticality (10-40) + Deadline Urgency (3-25) + Overdue (0/20) + Operational Impact (5-15) + Age Factor (2-10)
    
    Category Tiers:
    - 80+: Critical
    - 60-79: High
    - 35-59: Medium
    - Below 35: Low
    """
    # 1. Asset Criticality Factor
    criticality_map = {
        "Critical": 40,
        "High": 30,
        "Medium": 20,
        "Low": 10
    }
    crit_score = criticality_map.get(criticality, 20)

    # 2. Deadline Urgency Factor
    try:
        current_planning_date = date(2026, 9, 18)
        deadline_date = date.fromisoformat(deadline_str)
        days_to_deadline = (deadline_date - current_planning_date).days

        if days_to_deadline <= 2:
            urgency_score = 25
            urgency_reason = f"Urgent: {days_to_deadline} day(s) until deadline"
        elif days_to_deadline <= 7:
            urgency_score = 15
            urgency_reason = f"Approaching: {days_to_deadline} days until deadline"
        elif days_to_deadline <= 14:
            urgency_score = 8
            urgency_reason = f"Medium: {days_to_deadline} days until deadline"
        else:
            urgency_score = 3
            urgency_reason = f"Flexible: {days_to_deadline} days until deadline"
    except Exception:
        urgency_score = 8
        urgency_reason = "Standard deadline schedule"

    # 3. Overdue Penalty Factor
    overdue_score = 20 if overdue else 0

    # 4. Operational Impact Factor
    if asset_type in ["Track", "Signal"]:
        impact_score = 15
        impact_level = "High Impact (Mainline Traffic Affecting)"
    elif asset_type in ["OHE", "Bridge", "Point Machine"]:
        impact_score = 12
        impact_level = "High Impact (Traction / Civil Asset)"
    else:
        impact_score = 8
        impact_level = "Medium Impact (Auxiliary Equipment)"

    # 5. Maintenance Age Factor
    age_factor = 10 if overdue else 3

    total_score = float(crit_score + urgency_score + overdue_score + impact_score + age_factor)

    if total_score >= 80:
        category = "Critical"
    elif total_score >= 60:
        category = "High"
    elif total_score >= 35:
        category = "Medium"
    else:
        category = "Low"

    breakdown = {
        "criticality_points": crit_score,
        "deadline_urgency_points": urgency_score,
        "urgency_reason": urgency_reason,
        "overdue_points": overdue_score,
        "operational_impact_points": impact_score,
        "impact_level": impact_level,
        "age_factor_points": age_factor,
        "total_score": total_score,
        "category": category
    }

    return total_score, breakdown, category


def recalculate_all_priorities(db: Session) -> Dict[str, Any]:
    """
    Batch recalculates priority scores for all maintenance tasks in the database.
    """
    tasks: List[MaintenanceTask] = db.query(MaintenanceTask).all()
    updated_count = 0
    categories = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}

    for task in tasks:
        score, factors, cat = calculate_priority_score(
            criticality=task.criticality,
            deadline_str=task.deadline,
            overdue=task.overdue,
            asset_type=task.asset_type,
            preferred_date_str=task.preferred_date
        )
        task.priority_score = score
        task.priority_factors = factors
        categories[cat] = categories.get(cat, 0) + 1
        updated_count += 1

    db.commit()

    return {
        "status": "success",
        "tasks_recalculated": updated_count,
        "category_distribution": categories,
        "formula": "Criticality (40) + Deadline Urgency (25) + Overdue (20) + Operational Impact (15) + Age Factor (10)"
    }
