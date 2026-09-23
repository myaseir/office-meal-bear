from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.dependencies import (
    get_create_order_use_case,
    get_list_orders_use_case,
    get_update_order_use_case,
)
from app.api.v1.schemas.order import OrderCreateRequest, OrderResponse, OrderUpdateRequest
from app.application.use_cases.create_order import (
    CreateOrderUseCase,
    InactiveEntityError,
    RestaurantNotFoundError,
    RiderNotFoundError,
)
from app.application.use_cases.list_orders import ListOrdersUseCase
from app.application.use_cases.update_order import OrderNotFoundError, UpdateOrderUseCase
from app.domain.services.order_calculator import InvalidOrderError

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    payload: OrderCreateRequest,
    use_case: CreateOrderUseCase = Depends(get_create_order_use_case),
):
    try:
        result = await use_case.execute(
            idempotency_key=payload.idempotency_key,
            order_date=payload.order_date,
            restaurant_id=payload.restaurant_id,
            rider_id=payload.rider_id,
            payment_method=payload.payment_method.value,
            payment_status=payload.payment_status.value,
            food_amount=payload.food_amount,
            delivery_charge=payload.delivery_charge,
            adjustment=payload.adjustment,
            fuel=payload.fuel,
            rider_tip=payload.rider_tip,
            amount_received=payload.amount_received,
        )
    except RestaurantNotFoundError:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    except RiderNotFoundError:
        raise HTTPException(status_code=404, detail="Rider not found")
    except InactiveEntityError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except InvalidOrderError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return OrderResponse(**result)


@router.get("", response_model=list[OrderResponse])
async def list_orders(
    rider_id: str | None = None,
    restaurant_id: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    use_case: ListOrdersUseCase = Depends(get_list_orders_use_case),
):
    results = await use_case.execute(
        rider_id=rider_id, restaurant_id=restaurant_id, date_from=date_from, date_to=date_to
    )
    return [OrderResponse(**r) for r in results]


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    payload: OrderUpdateRequest,
    use_case: UpdateOrderUseCase = Depends(get_update_order_use_case),
):
    try:
        result = await use_case.execute(
            order_id=order_id,
            food_amount=payload.food_amount,
            delivery_charge=payload.delivery_charge,
            adjustment=payload.adjustment,
            fuel=payload.fuel,
            rider_tip=payload.rider_tip,
            amount_received=payload.amount_received,
            payment_method=payload.payment_method.value,
            payment_status=payload.payment_status.value,
        )
    except OrderNotFoundError:
        raise HTTPException(status_code=404, detail="Order not found")
    except InvalidOrderError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return OrderResponse(**result)