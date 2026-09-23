from abc import ABC, abstractmethod

from app.domain.entities.rider_adjustment import RiderAdjustment


class RiderAdjustmentRepository(ABC):
    @abstractmethod
    async def create(self, adjustment: RiderAdjustment) -> dict:
        ...

    @abstractmethod
    async def list_by_rider(self, rider_id: str) -> list[dict]:
        ...

    @abstractmethod
    async def sum_by_rider(self, rider_id: str) -> float:
        ...