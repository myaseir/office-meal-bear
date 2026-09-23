from datetime import date, datetime

from pydantic import BaseModel


class ExpenseCreateRequest(BaseModel):
    expense_date: date
    category: str
    amount: float
    note: str | None = None


class ExpenseUpdateRequest(BaseModel):
    category: str
    amount: float
    note: str | None = None


class ExpenseResponse(BaseModel):
    id: str
    expense_date: date
    category: str
    amount: float
    note: str | None = None
    created_at: datetime
    