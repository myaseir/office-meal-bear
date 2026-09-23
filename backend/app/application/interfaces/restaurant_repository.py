from abc import ABC, abstractmethod


class RestaurantRepository(ABC):
    @abstractmethod
    async def get_by_id(self, restaurant_id: str) -> dict | None:
        ...

    @abstractmethod
    async def list_active(self) -> list[dict]:
        ...

    @abstractmethod
    async def create(self, name: str, commission_pct: float) -> dict:
        ...