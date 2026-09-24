import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

FINANCIAL_COLLECTIONS = ["orders", "expenses", "rider_adjustments"]

async def wipe():
    client = AsyncIOMotorClient(os.environ["MONGODB_URI"])
    db = client[os.environ["MONGODB_DB_NAME"]]

    print(f"About to wipe: {', '.join(FINANCIAL_COLLECTIONS)}")
    print(f"Restaurants and riders will NOT be touched.\n")

    for name in FINANCIAL_COLLECTIONS:
        result = await db[name].delete_many({})
        print(f"{name}: deleted {result.deleted_count} documents")

    client.close()
    print("\nDone.")

if __name__ == "__main__":
    asyncio.run(wipe())