"""
Audit Logs API Endpoint
BACKEND.md Phase 48 - Audit Logging
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.api.dependencies import get_db
from app.api.auth_deps import get_current_user
from app.services.audit_service import get_audit_logs

router = APIRouter(prefix="/audit", tags=["Audit Logging"])


@router.get("/logs")
def list_audit_logs(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (e.g. Farm, Task)"),
    entity_id: Optional[str] = Query(None, description="Filter by specific entity ID"),
    action: Optional[str] = Query(None, description="Filter by action name"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve audit trail of system operations."""
    return get_audit_logs(
        db,
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        limit=limit,
        offset=offset,
    )
