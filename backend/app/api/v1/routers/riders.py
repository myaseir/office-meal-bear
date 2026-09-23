from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.dependencies import get_rider_repository
from app.api.v1.schemas.rider import RiderCreate, RiderResponse, RiderUpdate

router = APIRouter(prefix="/riders", tags=["riders"])


@router.post("", response_model=RiderResponse, status_code=201)
async def create_rider(
    payload: RiderCreate,
    repo=Depends(get_rider_repository),
):
    doc = await repo.create(payload.name, payload.is_platform_rider)
    return RiderResponse(**doc)


@router.get("", response_model=list[RiderResponse])
async def list_riders(repo=Depends(get_rider_repository)):
    docs = await repo.list_active()
    return [RiderResponse(**d) for d in docs]


@router.patch("/{rider_id}", response_model=RiderResponse)
async def update_rider(
    rider_id: str,
    payload: RiderUpdate,
    repo=Depends(get_rider_repository),
):
    doc = await repo.update(rider_id, payload.model_dump(exclude_unset=True))
    if doc is None:
        raise HTTPException(status_code=404, detail="Rider not found")
    return RiderResponse(**doc)