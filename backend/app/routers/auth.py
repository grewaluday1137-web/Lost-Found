from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.core.deps import get_database, get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import UserCreate, UserLogin, UserResponse, UserRole, UserStatus, Token
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection is not available")

    # Check for existing user
    existing = await db.users.find_one({"email": user_in.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_doc = {
        "email": user_in.email.lower(),
        "name": user_in.name,
        "campus_id": user_in.campus_id,
        "department": user_in.department,
        "phone": user_in.phone,
        "password_hash": hash_password(user_in.password),
        "role": UserRole.REGULAR,
        "status": UserStatus.ACTIVE,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = await db.users.insert_one(user_doc)
    user_id_str = str(result.inserted_id)
    user_doc["_id"] = user_id_str

    access_token = create_access_token(subject=user_id_str, role=UserRole.REGULAR)

    await log_audit_event(
        actor_id=user_id_str,
        actor_email=user_doc["email"],
        action="USER_REGISTERED",
        target_type="user",
        target_id=user_id_str,
        db=db
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_doc
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection is not available")

    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.get("status") == UserStatus.DISABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact campus administration."
        )

    user_id_str = str(user["_id"])
    user["_id"] = user_id_str

    access_token = create_access_token(subject=user_id_str, role=user["role"])

    await log_audit_event(
        actor_id=user_id_str,
        actor_email=user["email"],
        action="USER_LOGIN",
        target_type="user",
        target_id=user_id_str,
        db=db
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user
