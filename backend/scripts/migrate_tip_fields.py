import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()  # loads from backend/.env

MONGO_URI = os.environ["MONGODB_URI"]
DB_NAME = os.environ["MONGODB_DB_NAME"]

async def migrate():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    orders = db["orders"]

    result1 = await orders.update_many(
        {"inputs.rider_tip": {"$exists": False}},
        {"$set": {"inputs.rider_tip": 0}},
    )
    print(f"inputs.rider_tip backfilled: {result1.modified_count}")

    result2 = await orders.update_many(
        {"calculated.effective_tip": {"$exists": False}},
        [{"$set": {"calculated.effective_tip": "$calculated.tip"}}],
    )
    print(f"calculated.effective_tip backfilled: {result2.modified_count}")

    client.close()

if __name__ == "__main__":
    asyncio.run(migrate())