import motor.motor_asyncio
from app.config import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_url)
db = client[settings.database_name]

# Collections
users_collection = db["users"]
candidates_collection = db["candidates"]
jobs_collection = db["jobs"]
applications_collection = db["applications"]


async def create_indexes():
    """Create MongoDB indexes for performance."""
    await users_collection.create_index("email", unique=True)
    await jobs_collection.create_index("status")
    await jobs_collection.create_index("recruiterId")
    await applications_collection.create_index("candidateId")
    await applications_collection.create_index("jobId")
    await applications_collection.create_index([("candidateId", 1), ("jobId", 1)], unique=True)
