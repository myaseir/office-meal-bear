from abc import ABC, abstractmethod
from datetime import date

from app.domain.entities.order import OrderCalculatedFields, OrderInputs


class OrderRepository(ABC):
    @abstractmethod
    async def find_by_idempotency_key(self, key: str) -> dict | None:
        """Return the existing order dict if this key was already used, else None."""

    @abstractmethod
    async def create(
        self,
        idempotency_key: str,
        order_date,
        restaurant: dict,
        rider: dict,
        payment_method: str,
        payment_status: str,
        inputs: OrderInputs,
        calculated: OrderCalculatedFields,
        calc_version: int,
    ) -> dict:
        """Persist the order and return the stored document."""

    @abstractmethod
    async def aggregate_rider_totals(self) -> list[dict]:
        """Per-rider totals across all orders: fuel, tip, delivery margin, rider earning, order count."""

    @abstractmethod
    async def aggregate_business_totals(self) -> dict:
        """
        Whole-business totals across ALL orders and riders: total_revenue (includes every
        rider's tip), total_tip, total_restaurant_payable, total_rider_earning,
        total_meal_bear_revenue (profit; platform-rider earnings are not subtracted),
        total_fuel, total_amount_due, order_count.
        """

    @abstractmethod
    async def list_filtered(
        self,
        rider_id: str | None = None,
        restaurant_id: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> list[dict]:
        """List orders, newest first, optionally filtered."""

    @abstractmethod
    async def get_by_id(self, order_id: str) -> dict | None:
        """Fetch a single order by id."""

    @abstractmethod
    async def update(
        self,
        order_id: str,
        inputs: OrderInputs,
        calculated: OrderCalculatedFields,
        calc_version: int,
    ) -> dict | None:
        """Overwrite an order's inputs+calculated fields. Returns updated doc, or None if not found."""

    @abstractmethod
    async def update_payment(
        self, order_id: str, payment_method: str, payment_status: str
    ) -> dict | None:
        """Update an order's payment method/status. Returns updated doc, or None if not found."""