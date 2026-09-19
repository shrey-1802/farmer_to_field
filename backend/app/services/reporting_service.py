"""
Reporting Engine
BACKEND.md Phase 41 - Reporting

Provides aggregated reporting endpoints backed by actual stored system data:
- field-performance
- yield-estimation
- risk-summary
- action-effectiveness
- water-usage
- sensor-history
- agent-activity
- market-analysis
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.models.action import ActionPlan, Task, IrrigationRun, ApprovalStatus, TaskStatus, ExecutionStatus
from app.db.models.agent import AgentRun, RiskEvent
from app.db.models.sensor import SensorReading, Sensor
from app.db.models.farm import Farm, Field, Zone
from app.db.models.ops import Alert, MarketPrice, AuditLog
from app.core.logging import logger


def _days_ago(days: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days)


# ------------------------------------------------------------------ #
#  Field Performance Report                                            #
# ------------------------------------------------------------------ #

def report_field_performance(
    db: Session,
    farm_id: str,
    field_id: Optional[str] = None,
    days: int = 30,
) -> Dict[str, Any]:
    """Aggregated sensor readings over a time window per field."""
    since = _days_ago(days)

    query = db.query(SensorReading).filter(
        SensorReading.farm_id == farm_id,
        SensorReading.timestamp >= since,
    )
    if field_id:
        query = query.filter(SensorReading.field_id == field_id)

    readings = query.order_by(SensorReading.timestamp).all()

    # Aggregate per field
    fields_data: Dict[str, Dict] = {}
    for r in readings:
        fid = r.field_id or "unknown"
        if fid not in fields_data:
            fields_data[fid] = {
                "field_id": fid,
                "reading_count": 0,
                "soil_moisture_avg": [],
                "temperature_avg": [],
                "humidity_avg": [],
                "ph_avg": [],
            }
        d = fields_data[fid]
        d["reading_count"] += 1
        m = r.measurements or {}
        if "soil_moisture" in m:
            d["soil_moisture_avg"].append(m["soil_moisture"])
        if "temperature" in m:
            d["temperature_avg"].append(m["temperature"])
        if "humidity" in m:
            d["humidity_avg"].append(m["humidity"])
        if "ph" in m:
            d["ph_avg"].append(m["ph"])

    def _avg(lst):
        return round(sum(lst) / len(lst), 2) if lst else None

    summary = []
    for fid, d in fields_data.items():
        summary.append({
            "field_id": fid,
            "reading_count": d["reading_count"],
            "avg_soil_moisture_pct": _avg(d["soil_moisture_avg"]),
            "avg_temperature_c": _avg(d["temperature_avg"]),
            "avg_humidity_pct": _avg(d["humidity_avg"]),
            "avg_ph": _avg(d["ph_avg"]),
        })

    return {
        "report": "field_performance",
        "farm_id": farm_id,
        "period_days": days,
        "since": since.isoformat(),
        "fields": summary,
        "total_readings": len(readings),
    }


# ------------------------------------------------------------------ #
#  Yield Estimation Report                                             #
# ------------------------------------------------------------------ #

def report_yield_estimation(
    db: Session,
    farm_id: str,
    field_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Yield estimation based on:
    - Average soil moisture adequacy over last 30 days
    - Number of successful irrigation tasks
    - Sensor health
    - Risk events that may have damaged crops
    """
    since = _days_ago(30)

    # Count successful tasks
    task_q = db.query(func.count(Task.id)).filter(
        Task.farm_id == farm_id,
        Task.status == TaskStatus.COMPLETED,
        Task.created_at >= since,
    )
    if field_id:
        task_q = task_q.filter(Task.field_id == field_id)
    completed_tasks = task_q.scalar() or 0

    # Count CRITICAL risk events
    risk_q = db.query(func.count(RiskEvent.id)).filter(
        RiskEvent.farm_id == farm_id,
        RiskEvent.severity == "CRITICAL",
        RiskEvent.detected_at >= since,
    )
    if field_id:
        risk_q = risk_q.filter(RiskEvent.field_id == field_id)
    critical_risks = risk_q.scalar() or 0

    # Average soil moisture
    readings_q = db.query(SensorReading).filter(
        SensorReading.farm_id == farm_id,
        SensorReading.timestamp >= since,
    )
    if field_id:
        readings_q = readings_q.filter(SensorReading.field_id == field_id)
    readings = readings_q.all()
    moisture_vals = [r.measurements.get("soil_moisture") for r in readings if r.measurements and "soil_moisture" in r.measurements]
    avg_moisture = round(sum(moisture_vals) / len(moisture_vals), 1) if moisture_vals else None

    # Yield factor (0-100): simplified agronomic model
    base_yield = 100.0
    if avg_moisture is not None:
        if avg_moisture < 25:
            base_yield -= 30  # severe drought stress
        elif avg_moisture < 40:
            base_yield -= 15  # moderate stress
        elif avg_moisture > 75:
            base_yield -= 10  # waterlogging risk
    base_yield -= critical_risks * 5  # each CRITICAL risk reduces yield 5%
    base_yield += min(completed_tasks * 2, 10)  # up to +10% for proactive management
    base_yield = max(0.0, min(100.0, base_yield))

    return {
        "report": "yield_estimation",
        "farm_id": farm_id,
        "field_id": field_id,
        "period_days": 30,
        "estimated_yield_index": round(base_yield, 1),
        "yield_category": (
            "EXCELLENT" if base_yield >= 85 else
            "GOOD" if base_yield >= 70 else
            "MODERATE" if base_yield >= 50 else
            "POOR"
        ),
        "factors": {
            "avg_soil_moisture_pct": avg_moisture,
            "completed_irrigation_tasks": completed_tasks,
            "critical_risk_events": critical_risks,
        },
        "note": "Simplified yield index (0-100) based on soil moisture adequacy, irrigation compliance, and risk events.",
    }


# ------------------------------------------------------------------ #
#  Risk Summary Report                                                 #
# ------------------------------------------------------------------ #

def report_risk_summary(
    db: Session,
    farm_id: str,
    days: int = 14,
    field_id: Optional[str] = None,
) -> Dict[str, Any]:
    since = _days_ago(days)
    q = db.query(RiskEvent).filter(
        RiskEvent.farm_id == farm_id,
        RiskEvent.detected_at >= since,
    )
    if field_id:
        q = q.filter(RiskEvent.field_id == field_id)
    risks = q.order_by(desc(RiskEvent.detected_at)).all()

    by_severity: Dict[str, int] = {}
    by_category: Dict[str, int] = {}
    for r in risks:
        by_severity[r.severity] = by_severity.get(r.severity, 0) + 1
        by_category[r.risk_type] = by_category.get(r.risk_type, 0) + 1

    resolved = sum(1 for r in risks if r.is_resolved)
    return {
        "report": "risk_summary",
        "farm_id": farm_id,
        "period_days": days,
        "total_risks": len(risks),
        "resolved_risks": resolved,
        "active_risks": len(risks) - resolved,
        "by_severity": by_severity,
        "by_category": by_category,
        "recent_risks": [
            {
                "id": r.id,
                "risk_type": r.risk_type,
                "severity": r.severity,
                "title": r.title,
                "is_resolved": r.is_resolved,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in risks[:10]
        ],
    }


# ------------------------------------------------------------------ #
#  Action Effectiveness Report                                         #
# ------------------------------------------------------------------ #

def report_action_effectiveness(
    db: Session,
    farm_id: str,
    days: int = 30,
) -> Dict[str, Any]:
    since = _days_ago(days)
    plans = db.query(ActionPlan).filter(
        ActionPlan.farm_id == farm_id,
        ActionPlan.created_at >= since,
    ).all()

    total = len(plans)
    approved = sum(1 for p in plans if p.approval_status == ApprovalStatus.APPROVED)
    rejected = sum(1 for p in plans if p.approval_status == ApprovalStatus.REJECTED)
    pending = sum(1 for p in plans if p.approval_status == ApprovalStatus.PENDING)
    expert_review = total - approved - rejected - pending

    tasks = db.query(Task).filter(
        Task.farm_id == farm_id,
        Task.created_at >= since,
    ).all()

    tasks_completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    tasks_failed = sum(1 for t in tasks if t.status == TaskStatus.FAILED)

    return {
        "report": "action_effectiveness",
        "farm_id": farm_id,
        "period_days": days,
        "action_plans": {
            "total": total,
            "approved": approved,
            "rejected": rejected,
            "pending": pending,
            "expert_review": expert_review,
            "approval_rate_pct": round(approved / total * 100, 1) if total else 0,
        },
        "tasks": {
            "total": len(tasks),
            "completed": tasks_completed,
            "failed": tasks_failed,
            "completion_rate_pct": round(tasks_completed / len(tasks) * 100, 1) if tasks else 0,
        },
    }


# ------------------------------------------------------------------ #
#  Water Usage Report                                                  #
# ------------------------------------------------------------------ #

def report_water_usage(
    db: Session,
    farm_id: str,
    days: int = 30,
    field_id: Optional[str] = None,
) -> Dict[str, Any]:
    since = _days_ago(days)

    # Completed irrigation runs
    runs_q = (
        db.query(IrrigationRun)
        .join(Task, IrrigationRun.task_id == Task.id)
        .filter(
            Task.farm_id == farm_id,
            IrrigationRun.status == ExecutionStatus.COMPLETED,
            IrrigationRun.created_at >= since,
        )
    )
    if field_id:
        runs_q = runs_q.filter(Task.field_id == field_id)

    runs = runs_q.all()

    total_water_liters = sum(r.water_applied_liters for r in runs)
    total_duration_min = sum(r.duration_minutes for r in runs)

    by_zone: Dict[str, Dict] = {}
    for r in runs:
        zid = r.zone_id
        if zid not in by_zone:
            by_zone[zid] = {"runs": 0, "water_liters": 0.0, "duration_minutes": 0.0}
        by_zone[zid]["runs"] += 1
        by_zone[zid]["water_liters"] += r.water_applied_liters
        by_zone[zid]["duration_minutes"] += r.duration_minutes

    return {
        "report": "water_usage",
        "farm_id": farm_id,
        "period_days": days,
        "total_irrigation_runs": len(runs),
        "total_water_applied_liters": round(total_water_liters, 1),
        "total_irrigation_duration_minutes": round(total_duration_min, 1),
        "by_zone": [
            {
                "zone_id": zid,
                "runs": v["runs"],
                "water_liters": round(v["water_liters"], 1),
                "duration_minutes": round(v["duration_minutes"], 1),
            }
            for zid, v in by_zone.items()
        ],
    }


# ------------------------------------------------------------------ #
#  Sensor History Report                                               #
# ------------------------------------------------------------------ #

def report_sensor_history(
    db: Session,
    farm_id: str,
    sensor_id: Optional[str] = None,
    days: int = 7,
    limit: int = 100,
    offset: int = 0,
) -> Dict[str, Any]:
    since = _days_ago(days)
    q = db.query(SensorReading).filter(
        SensorReading.farm_id == farm_id,
        SensorReading.timestamp >= since,
    )
    if sensor_id:
        q = q.filter(SensorReading.sensor_id == sensor_id)

    total = q.count()
    readings = q.order_by(desc(SensorReading.timestamp)).offset(offset).limit(limit).all()

    return {
        "report": "sensor_history",
        "farm_id": farm_id,
        "sensor_id": sensor_id,
        "period_days": days,
        "total": total,
        "limit": limit,
        "offset": offset,
        "readings": [
            {
                "id": r.id,
                "sensor_id": r.sensor_id,
                "field_id": r.field_id,
                "zone_id": r.zone_id,
                "measurements": r.measurements,
                "quality": r.quality,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in readings
        ],
    }


# ------------------------------------------------------------------ #
#  Agent Activity Report                                               #
# ------------------------------------------------------------------ #

def report_agent_activity(
    db: Session,
    farm_id: str,
    days: int = 14,
) -> Dict[str, Any]:
    since = _days_ago(days)
    runs = db.query(AgentRun).filter(
        AgentRun.farm_id == farm_id,
        AgentRun.started_at >= since,
    ).order_by(desc(AgentRun.started_at)).all()

    by_agent: Dict[str, Dict] = {}
    for r in runs:
        name = r.agent_name
        if name not in by_agent:
            by_agent[name] = {"runs": 0, "avg_confidence": [], "errors": 0}
        by_agent[name]["runs"] += 1
        if r.confidence is not None:
            by_agent[name]["avg_confidence"].append(r.confidence)
        if r.status == "ERROR":
            by_agent[name]["errors"] += 1

    def _avg(lst):
        return round(sum(lst) / len(lst), 3) if lst else None

    summary = [
        {
            "agent_name": name,
            "total_runs": d["runs"],
            "avg_confidence": _avg(d["avg_confidence"]),
            "error_count": d["errors"],
        }
        for name, d in by_agent.items()
    ]
    summary.sort(key=lambda x: x["total_runs"], reverse=True)

    return {
        "report": "agent_activity",
        "farm_id": farm_id,
        "period_days": days,
        "total_agent_runs": len(runs),
        "by_agent": summary,
    }


# ------------------------------------------------------------------ #
#  Market Analysis Report                                              #
# ------------------------------------------------------------------ #

def report_market_analysis(
    db: Session,
    crop_name: Optional[str] = None,
    days: int = 30,
) -> Dict[str, Any]:
    since = _days_ago(days)
    q = db.query(MarketPrice).filter(
        MarketPrice.price_date >= since.date(),
    )
    if crop_name:
        q = q.filter(MarketPrice.crop_name.ilike(f"%{crop_name}%"))

    prices = q.order_by(desc(MarketPrice.price_date)).all()

    by_crop: Dict[str, Dict] = {}
    for p in prices:
        cn = p.crop_name
        if cn not in by_crop:
            by_crop[cn] = {"prices": [], "mandis": set(), "trend": p.trend}
        by_crop[cn]["prices"].append(p.price_per_quintal)
        by_crop[cn]["mandis"].add(p.mandi)

    def _avg(lst):
        return round(sum(lst) / len(lst), 2) if lst else None

    summary = [
        {
            "crop": cn,
            "avg_price_per_quintal": _avg(d["prices"]),
            "min_price": min(d["prices"]) if d["prices"] else None,
            "max_price": max(d["prices"]) if d["prices"] else None,
            "mandis_covered": len(d["mandis"]),
            "trend": d["trend"],
        }
        for cn, d in by_crop.items()
    ]

    return {
        "report": "market_analysis",
        "period_days": days,
        "crop_filter": crop_name,
        "total_price_records": len(prices),
        "crops": summary,
    }
