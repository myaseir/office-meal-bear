from dataclasses import dataclass

from app.application.interfaces.order_repository import OrderRepository
from app.application.interfaces.rider_adjustment_repository import RiderAdjustmentRepository
from app.application.interfaces.rider_repository import RiderRepository

_EMPTY_TOTALS = {
    "total_fuel": 0.0,
    "total_rider_tip": 0.0,
    "total_rider_margin": 0.0,
    "total_rider_earning": 0.0,
    "order_count": 0,
}


@dataclass
class GetRiderSummariesUseCase:
    rider_repo: RiderRepository
    order_repo: OrderRepository
    adjustment_repo: RiderAdjustmentRepository

    async def execute(self) -> list[dict]:
        riders = await self.rider_repo.list_active()
        order_totals = await self.order_repo.aggregate_rider_totals()
        totals_by_rider = {t["rider_id"]: t for t in order_totals}

        summaries = []
        for rider in riders:
            totals = totals_by_rider.get(rider["id"], _EMPTY_TOTALS)
            is_platform_rider = rider.get("is_platform_rider", False)

            adjustment_total = await self.adjustment_repo.sum_by_rider(rider["id"])

            # Platform-owned rider (e.g. "Self"): the platform doesn't owe itself,
            # so nothing is pending — regardless of what earnings/adjustments add up to.
            # Earnings/fuel/tip/order_count stay real for record-keeping.
            net_payable = 0.0 if is_platform_rider else totals["total_rider_earning"] + adjustment_total

            summaries.append({
                "rider_id": rider["id"],
                "rider_name": rider["name"],
                "is_platform_rider": is_platform_rider,
                "order_count": totals["order_count"],
                "total_fuel": totals["total_fuel"],
                "total_rider_tip": totals["total_rider_tip"],
                "total_rider_margin": totals["total_rider_margin"],
                "total_rider_earning": totals["total_rider_earning"],
                "total_adjustments": round(adjustment_total, 2),
                "net_payable": round(net_payable, 2),
            })
        return summaries