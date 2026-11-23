import logging
from pymongo.errors import ServerSelectionTimeoutError
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    client = None
    db: AsyncIOMotorDatabase = None
    is_mock: bool = False

db_instance = MongoDB()

async def connect_to_mongo():
    uri = settings.MONGODB_URI.strip()
    logger.info("Configured MONGODB_URI: %s", uri if "@" not in uri else uri.split("@")[-1])

    if uri.lower() == "mock":
        try:
            from mongomock_motor import AsyncMongoMockClient
            logger.info("🚀 Using In-Memory Mock MongoDB (development mode).")
            db_instance.client = AsyncMongoMockClient()
            db_instance.db = db_instance.client[settings.DATABASE_NAME]
            db_instance.is_mock = True
            await init_db_indexes()
            return
        except ImportError:
            logger.warning("mongomock_motor is not installed. Falling back to standard motor client.")

    try:
        client = AsyncIOMotorClient(
            uri,
            serverSelectionTimeoutMS=3000
        )
        # Ping server to verify connection immediately
        await client.admin.command('ping')
        db_instance.client = client
        db_instance.db = client[settings.DATABASE_NAME]
        db_instance.is_mock = False
        logger.info("✅ Successfully connected to MongoDB database '%s'", settings.DATABASE_NAME)
        await init_db_indexes()
    except Exception as e:
        logger.warning(
            "\n" + "=" * 70 + "\n"
            "⚠️  COULD NOT CONNECT TO MONGODB:\n"
            "   %s\n\n"
            "👉 TO FIX THIS:\n"
            "   1. If using MongoDB Atlas:\n"
            "      Add your connection string to 'backend/.env':\n"
            "      MONGODB_URI=\"mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority\"\n\n"
            "   2. If you want to test right now with zero setup:\n"
            "      Set in 'backend/.env':\n"
            "      MONGODB_URI=\"mock\"\n"
            + "=" * 70 + "\n",
            e
        )
        # Attempt fallback to in-memory mock if localhost failed
        try:
            from mongomock_motor import AsyncMongoMockClient
            logger.info("ℹ️ Automatically activating In-Memory Mock MongoDB so server remains functional.")
            db_instance.client = AsyncMongoMockClient()
            db_instance.db = db_instance.client[settings.DATABASE_NAME]
            db_instance.is_mock = True
            await init_db_indexes()
        except Exception:
            pass

async def close_mongo_connection():
    if db_instance.client is not None and not db_instance.is_mock:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

async def get_database() -> AsyncIOMotorDatabase:
    return db_instance.db

async def init_db_indexes():
    """Initializes performance and uniqueness indexes for all collections."""
    if db_instance.db is None or db_instance.is_mock:
        return
    try:
        # Users indexes
        await db_instance.db.users.create_index("email", unique=True)
        await db_instance.db.users.create_index("role")

        # Reports indexes
        await db_instance.db.reports.create_index([("type", 1), ("moderation_status", 1), ("item_outcome", 1)])
        await db_instance.db.reports.create_index("category")
        await db_instance.db.reports.create_index("user_id")
        await db_instance.db.reports.create_index("created_at")

        # Claims indexes
        await db_instance.db.claims.create_index([("found_report_id", 1), ("claimant_id", 1)])
        await db_instance.db.claims.create_index("status")

        # QR Verification tokens indexes
        await db_instance.db.verification_tokens.create_index("token_hash", unique=True)
        await db_instance.db.verification_tokens.create_index("claim_id")
        await db_instance.db.verification_tokens.create_index("status")

        # Notifications indexes
        await db_instance.db.notifications.create_index([("user_id", 1), ("created_at", -1)])
        await db_instance.db.notifications.create_index("is_read")

        # Audit logs indexes
        await db_instance.db.audit_logs.create_index([("target_type", 1), ("target_id", 1)])
        await db_instance.db.audit_logs.create_index("timestamp")

        logger.info("MongoDB indexes successfully validated/created.")
    except Exception as e:
        logger.warning("Failed to create indexes: %s", e)
