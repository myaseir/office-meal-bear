from datetime import date, datetime

from pydantic import BaseModel, Field


class RiderAdjustmentCreate(BaseModel):
    rider_id: str
    amount: float  # positive = add to rider's payout, negative = deduct (e.g. advance)
    reason: str = Field(min_length=1, max_length=200)
    adjustment_date: date


class RiderAdjustmentResponse(BaseModel):
    id: str
    rider_id: str
    amount: float
    reason: str
    adjustment_date: str
    created_at: datetime


class RiderSummaryResponse(BaseModel):
    rider_id: str
    rider_name: str
    order_count: int
    total_fuel: float
    total_rider_margin: float
    total_rider_earning: float
    total_adjustments: float
    net_payable: float