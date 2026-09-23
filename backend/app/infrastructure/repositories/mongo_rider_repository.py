from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.application.interfaces.rider_repository import RiderRepository


def _serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    doc.setdefault("is_platform_rider", False)
    return doc


class MongoRiderRepository(RiderRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["riders"]

    async def get_by_id(self, rider_id: str) -> dict | None:
        try:
            oid = ObjectId(rider_id)
        except InvalidId:
            return None
        doc = await self._collection.find_one({"_id": oid})
        return _serialize(doc) if doc else None

    async def list_active(self) -> list[dict]:
        cursor = self._collection.find({"active": True}).sort("name", 1)
        return [_serialize(doc) async for doc in cursor]

    async def create(self, name: str, is_platform_rider: bool = False) -> dict:
        document = {"name": name, "active": True, "is_platform_rider": is_platform_rider}
        result = await self._collection.insert_one(document)
        document["_id"] = result.inserted_id
        return _serialize(document)

    async def update(self, rider_id: str, fields: dict) -> dict | None:
        try:
            oid = ObjectId(rider_id)
        except InvalidId:
            return None

        # Only allow known, non-None fields through — avoids accidental
        # overwrite of _id or unexpected keys from a loosely-built payload.
        allowed = {"name", "active", "is_platform_rider"}
        update_fields = {k: v for k, v in fields.items() if k in allowed and v is not None}

        if not update_fields:
            return await self.get_by_id(rider_id)

        result = await self._collection.find_one_and_update(
            {"_id": oid},
            {"$set": update_fields},
            return_document=True,
        )
        return _serialize(result) if result else None