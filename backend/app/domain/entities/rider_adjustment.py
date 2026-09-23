from dataclasses import dataclass
from datetime import date as date_type


@dataclass(frozen=True)
class RiderAdjustment:
    rider_id: str
    amount: float  # positive = added to rider's payout, negative = deducted
    reason: str
    adjustment_date: date_type