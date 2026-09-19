"""
Alert Notification Engine API
BACKEND.md Phase 32

Categories: SYSTEM, WEATHER, RISK, ACTION, SENSOR, EXPERT, MARKET
Severities: INFO, WARNING, HIGH, CRITICAL
"""

from typing import Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.db.models.farm import Farm
from app.db.models.ops import Alert
from app.schemas.ops import AlertCreate, AlertResponse
from app.services.event_bus import event_bus

router = APIRouter(prefix="/alerts", tags=["Alert Notification Engine"])


@router.get("", response_model=List[AlertResponse])
def list_alerts(
    farm_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    is_acknowledged: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    List alerts with category, severity, or acknowledgment filtering.
    """
    query = db.query(Alert)
    if farm_id:
        query = query.filter(Alert.farm_id == farm_id)
    if category:
        query = query.filter(Alert.category == category.upper())
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if is_acknowledged is not None:
        query = query.filter(Alert.is_acknowledged == is_acknowledged)

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    return alerts


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    alert_in: AlertCreate,
    db: Session = Depends(get_db),
):
    """
    Manually or programmatically raise an alert notification.
    """
    farm = db.query(Farm).filter(Farm.id == alert_in.farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm '{alert_in.farm_id}' not found",
        )

    alert = Alert(
        farm_id=alert_in.farm_id,
        field_id=alert_in.field_id,
        category=alert_in.category.upper(),
        severity=alert_in.severity.upper(),
        title=alert_in.title,
        message=alert_in.message,
        is_acknowledged=False,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    event_bus.publish("alert.created", {
        "alert_id": alert.id,
        "category": alert.category,
        "severity": alert.severity,
        "title": alert.title,
    })

    return alert


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
):
    """
    Acknowledge an alert notification.
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found",
        )

    if not alert.is_acknowledged:
        alert.is_acknowledged = True
        alert.acknowledged_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(alert)

    return alert
