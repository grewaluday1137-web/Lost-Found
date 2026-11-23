import asyncio
import os
import sys
from datetime import datetime, timezone
from pymongo.errors import ServerSelectionTimeoutError
from motor.motor_asyncio import AsyncIOMotorClient

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import UserRole, UserStatus

async def seed_database():
    uri = settings.MONGODB_URI.strip()
    print(f"Connecting to MongoDB at {uri if '@' not in uri else uri.split('@')[-1]}...")

    client = None
    if uri.lower() == "mock":
        from mongomock_motor import AsyncMongoMockClient
        print("Using in-memory mock MongoDB...")
        client = AsyncMongoMockClient()
    else:
        try:
            client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=4000)
            await client.admin.command('ping')
        except (ServerSelectionTimeoutError, Exception) as e:
            print("\n" + "=" * 65)
            print("❌ COULD NOT CONNECT TO MONGODB AT:", uri)
            print("\nReason:")
            print("  ", e)
            print("\n👉 HOW TO FIX:")
            print("  1. If using MongoDB Atlas:")
            print("     Paste your cluster URI into 'backend/.env':")
            print("     MONGODB_URI=\"mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority\"")
            print("\n  2. If you want to run the app right now with zero external setup:")
            print("     Set in 'backend/.env':")
            print("     MONGODB_URI=\"mock\"")
            print("=" * 65 + "\n")
            return

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
        print(f"✅ Created default Administrator account:")
        print(f"   Email:    {admin_email}")
        print(f"   Password: Admin@12345")
    else:
        print(f"ℹ️ Admin account '{admin_email}' already exists.")

    client.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed_database())
