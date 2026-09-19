"""
Audit Logging Service
BACKEND.md Phase 48 - Audit Logging

Records all important operations with full context:
- login / logout
- farm / field / sensor created
- simulation started
- risk detected
- action approved / rejected
- expert review requested
- task started / completed
- execution started / stopped
- settings changed
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.db.models.ops import AuditLog
from app.core.logging import logger, request_id_ctx


class AuditAction:
    """Catalog of auditable actions."""
    LOGIN = "login"
    LOGOUT = "logout"
    REGISTER = "register"
    FARM_CREATED = "farm.created"
    FIELD_CREATED = "field.created"
    ZONE_CREATED = "zone.created"
    SENSOR_CREATED = "sensor.created"
    SIMULATION_STARTED = "simulation.started"
    RISK_DETECTED = "risk.detected"
    RISK_RESOLVED = "risk.resolved"
    ACTION_APPROVED = "action.approved"
    ACTION_REJECTED = "action.rejected"
    EXPERT_REVIEW_REQUESTED = "expert.review.requested"
    EXPERT_CASE_RESOLVED = "expert.case.resolved"
    TASK_STARTED = "task.started"
    TASK_COMPLETED = "task.completed"
    TASK_FAILED = "task.failed"
    EXECUTION_STARTED = "execution.started"
    EXECUTION_STOPPED = "execution.stopped"
    SETTINGS_CHANGED = "settings.changed"
    IMAGE_UPLOADED = "image.uploaded"
    PASSWORD_CHANGED = "password.changed"


def audit_log(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    """
    Persist an audit log entry.

    Args:
        db: SQLAlchemy database session
        action: One of AuditAction constants
        entity_type: Type of the affected entity (e.g. 'Farm', 'Task')
        entity_id: ID of the affected entity
        user_id: ID of the user who triggered the action
        metadata: Additional contextual key-value data

    Returns:
        Persisted AuditLog row
    """
    req_id = request_id_ctx.get() if hasattr(request_id_ctx, "get") else None

    # Strip any sensitive keys from metadata before persisting
    safe_metadata = _sanitize_metadata(metadata or {})

    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        request_id=req_id,
        changes=safe_metadata,
        timestamp=datetime.now(timezone.utc),
    )
    try:
        db.add(entry)
        db.commit()
        logger.info(
            f"AUDIT [{action}] entity={entity_type}:{entity_id} user={user_id} req={req_id}"
        )
    except Exception as exc:
        db.rollback()
        logger.error(f"Failed to write audit log: {exc}")
    return entry


# Keys that must never appear in audit metadata
_SENSITIVE_KEYS = {"password", "token", "secret", "api_key", "jwt", "credential", "private_key"}


def _sanitize_metadata(data: Dict[str, Any]) -> Dict[str, Any]:
    """Remove sensitive fields from audit metadata."""
    return {
        k: "***REDACTED***" if k.lower() in _SENSITIVE_KEYS else v
        for k, v in data.items()
    }


def get_audit_logs(
    db: Session,
    user_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> Dict[str, Any]:
    """Query audit log entries with optional filters."""
    q = db.query(AuditLog)
    if user_id:
        q = q.filter(AuditLog.user_id == user_id)
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        q = q.filter(AuditLog.entity_id == entity_id)
    if action:
        q = q.filter(AuditLog.action == action)

    total = q.count()
    logs = q.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "request_id": log.request_id,
                "changes": log.changes,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            }
            for log in logs
        ],
    }
