from abc import ABC, abstractmethod


class RiderRepository(ABC):
    @abstractmethod
    async def get_by_id(self, rider_id: str) -> dict | None:
        ...

    @abstractmethod
    async def list_active(self) -> list[dict]:
        ...

    @abstractmethod
    async def create(self, name: str, is_platform_rider: bool = False) -> dict:
        ...

    @abstractmethod
    async def update(self, rider_id: str, fields: dict) -> dict | None:
        ...