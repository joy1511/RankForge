"""MongoDB database connection helper using motor (async driver)"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

# Global client and database references
_client: AsyncIOMotorClient | None = None
_db = None


async def connect_db():
    """Connect to MongoDB Atlas on application startup"""
    global _client, _db
    
    if not settings.mongodb_uri or "<username>" in settings.mongodb_uri:
        logger.warning("MongoDB URI not configured. Auth features will be unavailable.")
        return
    
    try:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
        _db = _client.get_default_database()
        
        # Verify connection
        await _client.admin.command("ping")
        logger.info("Connected to MongoDB Atlas successfully")
        
        # Create indexes
        await _db.users.create_index("email", unique=True)
        await _db.generations.create_index([("user_id", 1), ("timestamp", -1)])
        logger.info("Database indexes created")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        _client = None
        _db = None


async def close_db():
    """Close MongoDB connection on shutdown"""
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")


def get_db():
    """Get the database instance"""
    return _db


def get_users_collection():
    """Get the users collection"""
    if _db is None:
        return None
    return _db.users
