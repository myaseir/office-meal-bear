from dataclasses import dataclass
from datetime import date

from app.application.interfaces.rider_adjustment_repository import RiderAdjustmentRepository
from app.application.interfaces.rider_repository import RiderRepository
from app.application.use_cases.create_order import RiderNotFoundError
from app.domain.entities.rider_adjustment import RiderAdjustment


@dataclass
class CreateRiderAdjustmentUseCase:
    rider_repo: RiderRepository
    adjustment_repo: RiderAdjustmentRepository

    async def execute(
        self, rider_id: str, amount: float, reason: str, adjustment_date: date
    ) -> dict:
        rider = await self.rider_repo.get_by_id(rider_id)
        if rider is None:
            raise RiderNotFoundError(rider_id)

        adjustment = RiderAdjustment(
            rider_id=rider_id, amount=amount, reason=reason, adjustment_date=adjustment_date
        )
        return await self.adjustment_repo.create(adjustment)