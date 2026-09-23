from abc import ABC, abstractmethod
from datetime import date

from app.domain.entities.expense import ExpenseInputs


class ExpenseRepository(ABC):
    @abstractmethod
    async def create(self, expense_date: date, inputs: ExpenseInputs) -> dict: ...

    @abstractmethod
    async def list_filtered(
        self, date_from: date | None = None, date_to: date | None = None
    ) -> list[dict]: ...

    @abstractmethod
    async def update(self, expense_id: str, inputs: ExpenseInputs) -> dict | None: ...

    @abstractmethod
    async def delete(self, expense_id: str) -> bool: ...