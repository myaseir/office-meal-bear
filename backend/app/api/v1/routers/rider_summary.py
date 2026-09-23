from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.dependencies import get_create_rider_adjustment_use_case, get_rider_summaries_use_case
from app.api.v1.schemas.rider_adjustment import (
    RiderAdjustmentCreate,
    RiderAdjustmentResponse,
    RiderSummaryResponse,
)
from app.application.use_cases.create_order import RiderNotFoundError
from app.application.use_cases.create_rider_adjustment import CreateRiderAdjustmentUseCase
from app.application.use_cases.get_rider_summaries import GetRiderSummariesUseCase

router = APIRouter(prefix="/riders", tags=["rider-summary"])


@router.get("/summary", response_model=list[RiderSummaryResponse])
async def get_rider_summaries(
    use_case: GetRiderSummariesUseCase = Depends(get_rider_summaries_use_case),
):
    return await use_case.execute()


@router.post("/adjustments", response_model=RiderAdjustmentResponse, status_code=201)
async def create_rider_adjustment(
    payload: RiderAdjustmentCreate,
    use_case: CreateRiderAdjustmentUseCase = Depends(get_create_rider_adjustment_use_case),
):
    try:
        result = await use_case.execute(
            rider_id=payload.rider_id,
            amount=payload.amount,
            reason=payload.reason,
            adjustment_date=payload.adjustment_date,
        )
    except RiderNotFoundError:
        raise HTTPException(status_code=404, detail="Rider not found")
    return result