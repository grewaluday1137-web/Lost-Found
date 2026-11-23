import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = MongoDB()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB at: %s", settings.MONGODB_URI)
    try:
        db_instance.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000
        )
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        logger.info("Successfully connected to database '%s'", settings.DATABASE_NAME)
        await init_db_indexes()
    except Exception as e:
        logger.warning("Could not immediately connect to MongoDB (%s). The server will start, but database operations may fail until the database is available.", e)

async def close_mongo_connection():
    if db_instance.client is not None:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

async def get_database() -> AsyncIOMotorDatabase:
    return db_instance.db

async def init_db_indexes():
    """Initializes performance and uniqueness indexes for all collections."""
    if db_instance.db is None:
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
        # Text search index
        await db_instance.db.reports.create_index([
            ("item_name", "text"),
            ("description", "text"),
            ("brand", "text"),
            ("location", "text")
        ])

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
