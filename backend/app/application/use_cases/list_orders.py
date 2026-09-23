from dataclasses import dataclass
from datetime import date

from app.application.interfaces.order_repository import OrderRepository


@dataclass
class ListOrdersUseCase:
    order_repo: OrderRepository

    async def execute(
        self,
        rider_id: str | None = None,
        restaurant_id: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> list[dict]:
        return await self.order_repo.list_filtered(
            rider_id=rider_id, restaurant_id=restaurant_id, date_from=date_from, date_to=date_to
        )