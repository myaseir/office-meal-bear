from dataclasses import dataclass

from app.application.interfaces.order_repository import OrderRepository
from app.application.interfaces.restaurant_repository import RestaurantRepository
from app.application.interfaces.rider_repository import RiderRepository
from app.domain.entities.order import OrderInputs
from app.domain.services.order_calculator import CALC_VERSION, calculate_order_financials


class RestaurantNotFoundError(Exception):
    pass


class RiderNotFoundError(Exception):
    pass


class InactiveEntityError(Exception):
    pass


@dataclass
class CreateOrderUseCase:
    order_repo: OrderRepository
    restaurant_repo: RestaurantRepository
    rider_repo: RiderRepository

    async def execute(
        self,
        idempotency_key: str,
        order_date,
        restaurant_id: str,
        rider_id: str,
        payment_method: str,
        payment_status: str,
        food_amount: float,
        delivery_charge: float,
        adjustment: float,
        fuel: float,
        amount_received: float,
        rider_tip: float = 0.0,
    ) -> dict:
        # 1. Idempotency check — first, before touching anything else
        existing = await self.order_repo.find_by_idempotency_key(idempotency_key)
        if existing is not None:
            return existing

        # 2. Load and validate references
        restaurant = await self.restaurant_repo.get_by_id(restaurant_id)
        if restaurant is None:
            raise RestaurantNotFoundError(restaurant_id)
        if not restaurant["active"]:
            raise InactiveEntityError(f"Restaurant {restaurant_id} is inactive")

        rider = await self.rider_repo.get_by_id(rider_id)
        if rider is None:
            raise RiderNotFoundError(rider_id)
        if not rider["active"]:
            raise InactiveEntityError(f"Rider {rider_id} is inactive")

        # 3. Calculate — backend-authoritative, regardless of what the client displayed
        inputs = OrderInputs(
            food_amount=food_amount,
            delivery_charge=delivery_charge,
            adjustment=adjustment,
            amount_received=amount_received,
            fuel=fuel,
            rider_tip=rider_tip,
        )
        calculated = calculate_order_financials(
            inputs,
            commission_pct=restaurant["commission_pct"],
            is_platform_rider=rider.get("is_platform_rider", False),
        )

        # 4. Persist
        return await self.order_repo.create(
            idempotency_key=idempotency_key,
            order_date=order_date,
            restaurant=restaurant,
            rider=rider,
            payment_method=payment_method,
            payment_status=payment_status,
            inputs=inputs,
            calculated=calculated,
            calc_version=CALC_VERSION,
        )