from datetime import date, datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.application.interfaces.rider_adjustment_repository import RiderAdjustmentRepository
from app.domain.entities.rider_adjustment import RiderAdjustment


def _serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


class MongoRiderAdjustmentRepository(RiderAdjustmentRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["rider_adjustments"]

    async def create(self, adjustment: RiderAdjustment) -> dict:
        document = {
            "rider_id": adjustment.rider_id,
            "amount": adjustment.amount,
            "reason": adjustment.reason,
            "adjustment_date": (
                adjustment.adjustment_date.isoformat()
                if isinstance(adjustment.adjustment_date, date)
                else adjustment.adjustment_date
            ),
            "created_at": datetime.now(timezone.utc),
        }
        result = await self._collection.insert_one(document)
        document["_id"] = result.inserted_id
        return _serialize(document)

    async def list_by_rider(self, rider_id: str) -> list[dict]:
        cursor = self._collection.find({"rider_id": rider_id}).sort("created_at", -1)
        return [_serialize(doc) async for doc in cursor]

    async def sum_by_rider(self, rider_id: str) -> float:
        pipeline = [
            {"$match": {"rider_id": rider_id}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        result = await self._collection.aggregate(pipeline).to_list(length=1)
        return result[0]["total"] if result else 0.0