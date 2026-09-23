from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.application.interfaces.restaurant_repository import RestaurantRepository


def _serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


class MongoRestaurantRepository(RestaurantRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["restaurants"]

    async def get_by_id(self, restaurant_id: str) -> dict | None:
        try:
            oid = ObjectId(restaurant_id)
        except InvalidId:
            return None
        doc = await self._collection.find_one({"_id": oid})
        return _serialize(doc) if doc else None

    async def list_active(self) -> list[dict]:
        cursor = self._collection.find({"active": True}).sort("name", 1)
        return [_serialize(doc) async for doc in cursor]

    async def create(self, name: str, commission_pct: float) -> dict:
        document = {"name": name, "commission_pct": commission_pct, "active": True}
        result = await self._collection.insert_one(document)
        document["_id"] = result.inserted_id
        return _serialize(document)