"""
Authentication Dependency: get_current_user
Validates JWT Bearer token and returns the authenticated User from the database.
"""
from typing import Annotated, Generator
from fastapi import Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.db.database import get_db
from app.db.models.user import User

http_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Security(http_bearer)],
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise UnauthorizedError("Authentication required. Please provide a Bearer token.")

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise UnauthorizedError("Invalid or expired token. Please log in again.")

    user_id: str = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token payload.")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise UnauthorizedError("User account not found or disabled.")

    return user


def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "ADMIN":
        from app.core.exceptions import ForbiddenError
        raise ForbiddenError("Admin access required for this operation.")
    return current_user


def require_farm_owner(farm_user_id: str, current_user: User) -> None:
    """Verify current user owns the farm, unless they're an ADMIN."""
    if current_user.role != "ADMIN" and farm_user_id != current_user.id:
        from app.core.exceptions import ForbiddenError
        raise ForbiddenError("You do not have permission to access this farm's resources.")
