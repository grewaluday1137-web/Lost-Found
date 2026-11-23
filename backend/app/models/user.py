from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserRole(str, Enum):
    REGULAR = "regular"
    ADMIN = "admin"

class UserStatus(str, Enum):
    ACTIVE = "active"
    DISABLED = "disabled"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    campus_id: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str = Field(alias="_id")
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

class UserInDB(UserBase):
    id: Optional[str] = Field(default=None, alias="_id")
    password_hash: str
    role: UserRole = UserRole.REGULAR
    status: UserStatus = UserStatus.ACTIVE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
