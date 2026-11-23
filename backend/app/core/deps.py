from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.core.security import decode_access_token
from app.core.database import get_database
from app.models.user import UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    if db is None:
        raise HTTPException(status_code=500, detail="Database connection is not available")

    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise credentials_exception

    if user is None:
        raise credentials_exception

    if user.get("status") == "disabled":
        raise HTTPException(status_code=403, detail="Account is disabled. Contact campus administration.")

    user["_id"] = str(user["_id"])
    return user

async def get_current_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    if current_user.get("role") != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have sufficient administrative privileges."
        )
    return current_user

async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Optional[dict]:
    if not token or db is None:
        return None
    try:
        payload = decode_access_token(token)
        if not payload or not payload.get("sub"):
            return None
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if user:
            user["_id"] = str(user["_id"])
            return user
    except Exception:
        return None
    return None
