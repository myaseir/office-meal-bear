from dataclasses import dataclass

from app.application.interfaces.order_repository import OrderRepository
from app.domain.entities.order import OrderInputs
from app.domain.services.order_calculator import CALC_VERSION, calculate_order_financials


class OrderNotFoundError(Exception):
    pass


@dataclass
class UpdateOrderUseCase:
    order_repo: OrderRepository

    async def execute(
        self,
        order_id: str,
        food_amount: float,
        delivery_charge: float,
        adjustment: float,
        fuel: float,
        rider_tip: float,
        amount_received: float,
        payment_method: str,
        payment_status: str,
    ) -> dict:
        existing = await self.order_repo.get_by_id(order_id)
        if existing is None:
            raise OrderNotFoundError(order_id)

        inputs = OrderInputs(
            food_amount=food_amount,
            delivery_charge=delivery_charge,
            adjustment=adjustment,
            amount_received=amount_received,
            fuel=fuel,
            rider_tip=rider_tip,
        )
        # Use the commission rate locked in at order creation time, not today's rate.
        # Same for is_platform_rider — use the flag as it was on the rider at order
        # creation time, not today's value, so edits to old orders stay consistent
        # with how they were originally booked.
        calculated = calculate_order_financials(
            inputs,
            commission_pct=existing["commission_pct_snapshot"],
            is_platform_rider=existing.get("is_platform_rider_snapshot", False),
        )

        updated = await self.order_repo.update(order_id, inputs, calculated, CALC_VERSION)
        if updated is None:
            raise OrderNotFoundError(order_id)

        # payment_method/status aren't part of inputs/calculated — persist separately.
        await self.order_repo.update_payment(order_id, payment_method, payment_status)
        updated["payment_method"] = payment_method
        updated["payment_status"] = payment_status
        return updated