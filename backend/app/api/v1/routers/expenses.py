from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.schemas.expense import ExpenseCreateRequest, ExpenseResponse, ExpenseUpdateRequest
from app.application.interfaces.expense_repository import ExpenseRepository
from app.domain.entities.expense import ExpenseInputs
# adjust this import to wherever your dependency providers live
from app.api.v1.dependencies import get_expense_repository

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    payload: ExpenseCreateRequest,
    repo: ExpenseRepository = Depends(get_expense_repository),
):
    result = await repo.create(
        payload.expense_date,
        ExpenseInputs(category=payload.category, amount=payload.amount, note=payload.note),
    )
    return ExpenseResponse(**result)


@router.get("", response_model=list[ExpenseResponse])
async def list_expenses(
    date_from: date | None = None,
    date_to: date | None = None,
    repo: ExpenseRepository = Depends(get_expense_repository),
):
    results = await repo.list_filtered(date_from=date_from, date_to=date_to)
    return [ExpenseResponse(**r) for r in results]


@router.patch("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    payload: ExpenseUpdateRequest,
    repo: ExpenseRepository = Depends(get_expense_repository),
):
    result = await repo.update(
        expense_id, ExpenseInputs(category=payload.category, amount=payload.amount, note=payload.note)
    )
    if not result:
        raise HTTPException(status_code=404, detail="Expense not found")
    return ExpenseResponse(**result)


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: str,
    repo: ExpenseRepository = Depends(get_expense_repository),
):
    deleted = await repo.delete(expense_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")