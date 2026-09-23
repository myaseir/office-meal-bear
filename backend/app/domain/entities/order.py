from dataclasses import dataclass
from enum import Enum


class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    ONLINE = "online"


class PaymentStatus(str, Enum):
    PAID = "paid"
    PARTIAL = "partial"
    UNPAID = "unpaid"


class OrderStatus(str, Enum):
    CREATED = "created"
    CANCELLED = "cancelled"


@dataclass(frozen=True)
class OrderInputs:
    """Exactly what the user types on the form. Nothing derived lives here."""
    food_amount: float
    delivery_charge: float
    adjustment: float
    amount_received: float
    fuel: float
    rider_tip: float = 0.0 


@dataclass(frozen=True)
class OrderCalculatedFields:
    """Backend-derived values. Never trust these if they arrive from a client request."""
    final_delivery: float
    customer_total: float
    commission_amount: float
    restaurant_payable: float
    tip: float             # raw overcharge (amount_received - customer_total), audit-only
    effective_tip: float   # NEW — what actually reached the rider (manual tip, else overcharge)
    amount_due: float
    rider_earning: float
    meal_bear_revenue: float
    