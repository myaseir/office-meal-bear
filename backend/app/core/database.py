from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings


class MongoDB:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


mongodb = MongoDB()


async def connect_to_mongo() -> None:
    settings = get_settings()
    mongodb.client = AsyncIOMotorClient(settings.mongodb_uri)
    mongodb.db = mongodb.client[settings.mongodb_db_name]
    # Fail fast on startup if the connection string / cluster is unreachable,
    # instead of discovering it on the first order submission.
    await mongodb.client.admin.command("ping")

    await mongodb.db["orders"].create_index("idempotency_key", unique=True)
    await mongodb.db["orders"].create_index("order_date")
    await mongodb.db["orders"].create_index("restaurant.id")
    await mongodb.db["orders"].create_index("rider.id")
    await mongodb.db["restaurants"].create_index("active")
    await mongodb.db["riders"].create_index("active")


async def close_mongo_connection() -> None:
    if mongodb.client:
        mongodb.client.close()


def get_database() -> AsyncIOMotorDatabase:
    if mongodb.db is None:
        raise RuntimeError("Database not initialized — connect_to_mongo() must run first.")
    return mongodb.db