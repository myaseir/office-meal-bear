from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_restaurant_repository
from app.api.v1.schemas.restaurant import RestaurantCreate, RestaurantResponse

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.post("", response_model=RestaurantResponse, status_code=201)
async def create_restaurant(
    payload: RestaurantCreate,
    repo=Depends(get_restaurant_repository),
):
    doc = await repo.create(payload.name, payload.commission_pct)
    return RestaurantResponse(**doc)


@router.get("", response_model=list[RestaurantResponse])
async def list_restaurants(repo=Depends(get_restaurant_repository)):
    docs = await repo.list_active()
    return [RestaurantResponse(**d) for d in docs]