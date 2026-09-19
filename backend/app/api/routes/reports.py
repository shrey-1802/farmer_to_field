"""
Reporting API Routes
BACKEND.md Phase 41 - Reporting

Reports generated from actual stored system data:
  GET /api/reports/field-performance
  GET /api/reports/yield-estimation
  GET /api/reports/risk-summary
  GET /api/reports/action-effectiveness
  GET /api/reports/water-usage
  GET /api/reports/sensor-history
  GET /api/reports/agent-activity
  GET /api/reports/market-analysis
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.api.dependencies import get_db
from app.services.reporting_service import (
    report_field_performance,
    report_yield_estimation,
    report_risk_summary,
    report_action_effectiveness,
    report_water_usage,
    report_sensor_history,
    report_agent_activity,
    report_market_analysis,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/field-performance")
def get_field_performance(
    farm_id: str = Query(..., description="Farm ID to report on"),
    field_id: Optional[str] = Query(None, description="Optional field filter"),
    days: int = Query(30, ge=1, le=365, description="Lookback period in days"),
    db: Session = Depends(get_db),
):
    """Aggregated sensor readings and field health over a time window."""
    return report_field_performance(db, farm_id=farm_id, field_id=field_id, days=days)


@router.get("/yield-estimation")
def get_yield_estimation(
    farm_id: str = Query(..., description="Farm ID"),
    field_id: Optional[str] = Query(None, description="Optional field filter"),
    db: Session = Depends(get_db),
):
    """Yield index based on soil moisture, irrigation compliance, and risk events."""
    return report_yield_estimation(db, farm_id=farm_id, field_id=field_id)


@router.get("/risk-summary")
def get_risk_summary(
    farm_id: str = Query(..., description="Farm ID"),
    field_id: Optional[str] = Query(None),
    days: int = Query(14, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """Risk event breakdown by severity and category."""
    return report_risk_summary(db, farm_id=farm_id, days=days, field_id=field_id)


@router.get("/action-effectiveness")
def get_action_effectiveness(
    farm_id: str = Query(..., description="Farm ID"),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """Approval rates, task completion, and action plan stats."""
    return report_action_effectiveness(db, farm_id=farm_id, days=days)


@router.get("/water-usage")
def get_water_usage(
    farm_id: str = Query(..., description="Farm ID"),
    field_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """Irrigation water usage by zone and period."""
    return report_water_usage(db, farm_id=farm_id, days=days, field_id=field_id)


@router.get("/sensor-history")
def get_sensor_history(
    farm_id: str = Query(..., description="Farm ID"),
    sensor_id: Optional[str] = Query(None),
    days: int = Query(7, ge=1, le=365),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Paginated sensor reading history."""
    return report_sensor_history(
        db, farm_id=farm_id, sensor_id=sensor_id, days=days, limit=limit, offset=offset
    )


@router.get("/agent-activity")
def get_agent_activity(
    farm_id: str = Query(..., description="Farm ID"),
    days: int = Query(14, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """Agent run counts, confidence averages, and error rates."""
    return report_agent_activity(db, farm_id=farm_id, days=days)


@router.get("/market-analysis")
def get_market_analysis(
    crop_name: Optional[str] = Query(None, description="Filter by crop name"),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """Market price trends and mandi coverage."""
    return report_market_analysis(db, crop_name=crop_name, days=days)
