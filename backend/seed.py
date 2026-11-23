import asyncio
import os
import sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import UserRole, UserStatus

async def seed_database():
    print(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.DATABASE_NAME]

    admin_email = "admin@campus.edu"
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin_doc = {
            "email": admin_email,
            "name": "Campus Administrator",
            "campus_id": "ADMIN-001",
            "department": "Campus Security & Lost Property",
            "phone": "+1-555-0199",
            "password_hash": hash_password("Admin@12345"),
            "role": UserRole.ADMIN,
            "status": UserStatus.ACTIVE,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(admin_doc)
        print(f"✅ Created default Administrator account: {admin_email} (Password: Admin@12345)")
    else:
        print(f"ℹ️ Admin account '{admin_email}' already exists.")

    client.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed_database())
