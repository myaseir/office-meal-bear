from dataclasses import dataclass
from datetime import date


@dataclass
class ExpenseInputs:
    category: str          # e.g. "rent", "utilities", "supplies", "misc"
    amount: float
    note: str | None = None


@dataclass
class Expense:
    id: str
    expense_date: date
    category: str
    amount: float
    note: str | None
    created_at: str