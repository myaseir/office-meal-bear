import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

RIDER_ID = "6ab28c49eb75f40bb7238d03"  # Self

async def main():
    client = AsyncIOMotorClient(os.environ["MONGODB_URI"])
    db = client[os.environ["MONGODB_DB_NAME"]]

    result = await db["riders"].delete_one({"_id": ObjectId(RIDER_ID)})
    print(f"Deleted {result.deleted_count} rider(s)")

    client.close()

if __name__ == "__main__":
    asyncio.run(main())