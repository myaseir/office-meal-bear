from datetime import date, datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.application.interfaces.order_repository import OrderRepository
from app.domain.entities.order import OrderCalculatedFields, OrderInputs, OrderStatus


def _serialize(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "idempotency_key": doc["idempotency_key"],
        "order_date": doc["order_date"],
        "status": doc["status"],
        "restaurant_id": str(doc["restaurant"]["id"]),
        "restaurant_name": doc["restaurant"]["name_snapshot"],
        "commission_pct_snapshot": doc["restaurant"]["commission_pct_snapshot"],
        "rider_id": str(doc["rider"]["id"]),
        "rider_name": doc["rider"]["name_snapshot"],
        "is_platform_rider_snapshot": doc["rider"].get("is_platform_rider_snapshot", False),
        "payment_method": doc["payment"]["method"],
        "payment_status": doc["payment"]["status"],
        **doc["inputs"],
        **doc["calculated"],
        "calc_version": doc["calc_version"],
        "created_at": doc["created_at"],
    }


def _inputs_to_dict(inputs: OrderInputs) -> dict:
    return {
        "food_amount": inputs.food_amount,
        "delivery_charge": inputs.delivery_charge,
        "adjustment": inputs.adjustment,
        "fuel": inputs.fuel,
        "rider_tip": inputs.rider_tip,
        "amount_received": inputs.amount_received,
    }


def _calculated_to_dict(calculated: OrderCalculatedFields) -> dict:
    return {
        "final_delivery": calculated.final_delivery,
        "customer_total": calculated.customer_total,
        "commission_amount": calculated.commission_amount,
        "restaurant_payable": calculated.restaurant_payable,
        "tip": calculated.tip,
        "effective_tip": calculated.effective_tip,
        "amount_due": calculated.amount_due,
        "rider_earning": calculated.rider_earning,
        "meal_bear_revenue": calculated.meal_bear_revenue,
    }


class MongoOrderRepository(OrderRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db["orders"]

    async def find_by_idempotency_key(self, key: str) -> dict | None:
        doc = await self._collection.find_one({"idempotency_key": key})
        return _serialize(doc) if doc else None

    async def create(
        self,
        idempotency_key: str,
        order_date: date,
        restaurant: dict,
        rider: dict,
        payment_method: str,
        payment_status: str,
        inputs: OrderInputs,
        calculated: OrderCalculatedFields,
        calc_version: int,
    ) -> dict:
        document = {
            "idempotency_key": idempotency_key,
            "order_date": order_date.isoformat() if isinstance(order_date, date) else order_date,
            "status": OrderStatus.CREATED.value,
            "restaurant": {
                "id": restaurant["id"],
                "name_snapshot": restaurant["name"],
                "commission_pct_snapshot": restaurant["commission_pct"],
            },
            "rider": {
                "id": rider["id"],
                "name_snapshot": rider["name"],
                "is_platform_rider_snapshot": rider.get("is_platform_rider", False),
            },
            "payment": {
                "method": payment_method,
                "status": payment_status,
            },
            "inputs": _inputs_to_dict(inputs),
            "calculated": _calculated_to_dict(calculated),
            "calc_version": calc_version,
            "created_at": datetime.now(timezone.utc),
        }

        try:
            result = await self._collection.insert_one(document)
            document["_id"] = result.inserted_id
            return _serialize(document)
        except DuplicateKeyError:
            existing = await self._collection.find_one({"idempotency_key": idempotency_key})
            return _serialize(existing)

    async def aggregate_rider_totals(self) -> list[dict]:
        pipeline = [
            {
                "$group": {
                    "_id": "$rider.id",
                    "rider_name": {"$first": "$rider.name_snapshot"},
                    "is_platform_rider": {"$first": "$rider.is_platform_rider_snapshot"},
                    "total_fuel": {"$sum": "$inputs.fuel"},
                    "total_rider_tip": {"$sum": "$calculated.effective_tip"},
                    "total_rider_earning": {"$sum": "$calculated.rider_earning"},
                    "order_count": {"$sum": 1},
                }
            }
        ]
        results = []
        async for doc in self._collection.aggregate(pipeline):
            is_platform_rider = bool(doc.get("is_platform_rider", False))
            total_margin = doc["total_rider_earning"] - doc["total_fuel"] - doc["total_rider_tip"]
            results.append({
                "rider_id": doc["_id"],
                "total_fuel": round(doc["total_fuel"], 2),
                "total_rider_tip": round(doc["total_rider_tip"], 2),
                # Platform-owned rider (e.g. "Self"): nothing is actually payable —
                # the platform doesn't owe itself. Earning/fuel/tip stay as real
                # tracked numbers; only the "pending payout" figure is zeroed.
                "total_rider_margin": 0.0 if is_platform_rider else round(total_margin, 2),
                "total_rider_earning": round(doc["total_rider_earning"], 2),
                "order_count": doc["order_count"],
                "is_platform_rider": is_platform_rider,
            })
        return results

    async def list_filtered(
        self,
        rider_id: str | None = None,
        restaurant_id: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> list[dict]:
        query: dict = {}
        if rider_id:
            query["rider.id"] = rider_id
        if restaurant_id:
            query["restaurant.id"] = restaurant_id
        if date_from or date_to:
            date_query = {}
            if date_from:
                date_query["$gte"] = date_from.isoformat()
            if date_to:
                date_query["$lte"] = date_to.isoformat()
            query["order_date"] = date_query

        cursor = self._collection.find(query).sort("order_date", -1)
        return [_serialize(doc) async for doc in cursor]

    async def get_by_id(self, order_id: str) -> dict | None:
        try:
            oid = ObjectId(order_id)
        except InvalidId:
            return None
        doc = await self._collection.find_one({"_id": oid})
        return _serialize(doc) if doc else None

    async def update(
        self, order_id: str, inputs: OrderInputs, calculated: OrderCalculatedFields, calc_version: int
    ) -> dict | None:
        try:
            oid = ObjectId(order_id)
        except InvalidId:
            return None

        result = await self._collection.find_one_and_update(
            {"_id": oid},
            {"$set": {"inputs": _inputs_to_dict(inputs), "calculated": _calculated_to_dict(calculated), "calc_version": calc_version}},
            return_document=True,
        )
        return _serialize(result) if result else None

    async def update_payment(
        self, order_id: str, payment_method: str, payment_status: str
    ) -> dict | None:
        try:
            oid = ObjectId(order_id)
        except InvalidId:
            return None

        result = await self._collection.find_one_and_update(
            {"_id": oid},
            {
                "$set": {
                    "payment.method": payment_method,
                    "payment.status": payment_status,
                }
            },
            return_document=True,
        )
        return _serialize(result) if result else None