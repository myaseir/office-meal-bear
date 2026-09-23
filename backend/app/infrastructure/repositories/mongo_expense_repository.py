from datetime import date, datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.application.interfaces.expense_repository import ExpenseRepository
from app.domain.entities.expense import ExpenseInputs


def _serialize(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "expense_date": doc["expense_date"],
        "category": doc["category"],
        "amount": doc["amount"],
        "note": doc.get("note"),
        "created_at": doc["created_at"],
    }


class MongoExpenseRepository(ExpenseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["expenses"]

    async def create(self, expense_date: date, inputs: ExpenseInputs) -> dict:
        document = {
            "expense_date": expense_date.isoformat(),
            "category": inputs.category,
            "amount": inputs.amount,
            "note": inputs.note,
            "created_at": datetime.now(timezone.utc),
        }
        result = await self._collection.insert_one(document)
        document["_id"] = result.inserted_id
        return _serialize(document)

    async def list_filtered(
        self, date_from: date | None = None, date_to: date | None = None
    ) -> list[dict]:
        query: dict = {}
        if date_from or date_to:
            date_query = {}
            if date_from:
                date_query["$gte"] = date_from.isoformat()
            if date_to:
                date_query["$lte"] = date_to.isoformat()
            query["expense_date"] = date_query

        cursor = self._collection.find(query).sort("expense_date", -1)
        return [_serialize(doc) async for doc in cursor]

    async def update(self, expense_id: str, inputs: ExpenseInputs) -> dict | None:
        try:
            oid = ObjectId(expense_id)
        except InvalidId:
            return None

        result = await self._collection.find_one_and_update(
            {"_id": oid},
            {"$set": {"category": inputs.category, "amount": inputs.amount, "note": inputs.note}},
            return_document=True,
        )
        return _serialize(result) if result else None

    async def delete(self, expense_id: str) -> bool:
        try:
            oid = ObjectId(expense_id)
        except InvalidId:
            return False
        result = await self._collection.delete_one({"_id": oid})
        return result.deleted_count > 0