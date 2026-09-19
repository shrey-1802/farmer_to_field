from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime


# ========================
# Base Schemas
# ========================

class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[Any]


class SuccessResponse(BaseModel):
    message: str
    data: Optional[Any] = None
