from datetime import date, datetime
from pydantic import BaseModel, Field, model_validator


from app.domain.entities.order import OrderStatus, PaymentMethod, PaymentStatus


class OrderCreateRequest(BaseModel):
    """
    Only raw inputs + references are accepted from the client.
    No financial field here is trusted — the backend recalculates everything.
    """
    idempotency_key: str = Field(min_length=8, max_length=100)
    order_date: date
    restaurant_id: str
    rider_id: str
    food_amount: float = Field(ge=0)
    delivery_charge: float = Field(ge=0)
    adjustment: float = 0
    fuel: float = Field(ge=0)
    rider_tip: float = Field(ge=0, default=0)
    amount_received: float = Field(ge=0)
    payment_method: PaymentMethod
    payment_status: PaymentStatus


class OrderUpdateRequest(BaseModel):
    """
    Edits money fields on an existing order. Restaurant/rider are NOT
    changeable here — assumption: reassigning an order to a different
    restaurant/rider after creation is out of scope. Confirm if wrong.
    """
    food_amount: float = Field(ge=0)
    delivery_charge: float = Field(ge=0)
    adjustment: float = 0
    fuel: float = Field(ge=0)
    rider_tip: float = Field(ge=0, default=0)
    amount_received: float = Field(ge=0)
    payment_method: PaymentMethod
    payment_status: PaymentStatus


class OrderResponse(BaseModel):
    id: str
    idempotency_key: str
    order_date: date
    status: OrderStatus

    restaurant_id: str
    restaurant_name: str
    rider_id: str
    rider_name: str

    payment_method: PaymentMethod
    payment_status: PaymentStatus

    # inputs
    food_amount: float
    delivery_charge: float
    adjustment: float
    fuel: float
    rider_tip: float
    amount_received: float

    # calculated (backend-authoritative)
    final_delivery: float
    customer_total: float
    commission_amount: float
    restaurant_payable: float
    tip: float
    effective_tip: float
    total_revenue: float = 0.0  # customer_total + effective_tip
    amount_due: float
    rider_earning: float
    meal_bear_revenue: float
    calc_version: int
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def fill_total_revenue_for_old_orders(cls, data):
        # Orders saved before total_revenue existed don't have it in MongoDB.
        if isinstance(data, dict) and "total_revenue" not in data:
            data = dict(data)
            data["total_revenue"] = (
                data.get("customer_total", 0.0) + data.get("effective_tip", 0.0)
            )
        return data