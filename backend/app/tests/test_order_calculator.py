import pytest

from app.domain.entities.order import OrderInputs
from app.domain.services.order_calculator import (
    InvalidOrderError,
    calculate_order_financials,
)


def test_example_order_from_spec():
    inputs = OrderInputs(
        food_amount=1500,
        delivery_charge=250,
        adjustment=-50,
        amount_received=2000,
        fuel=50,
    )

    result = calculate_order_financials(inputs, commission_pct=0.0)

    assert result.final_delivery == 200
    assert result.customer_total == 1700
    assert result.tip == 300
    assert result.commission_amount == 0
    assert result.restaurant_payable == 1500
    assert result.rider_earning == 125
    assert result.meal_bear_revenue == 375
    assert result.amount_due == 0


def test_underpayment_produces_amount_due_not_negative_tip():
    inputs = OrderInputs(
        food_amount=1500, delivery_charge=250, adjustment=0,
        amount_received=1000, fuel=50,
    )
    result = calculate_order_financials(inputs, commission_pct=0.10)

    assert result.tip == 0
    assert result.amount_due == 750  # 1750 - 1000


def test_negative_final_delivery_is_rejected():
    inputs = OrderInputs(
        food_amount=1000, delivery_charge=100, adjustment=-150,
        amount_received=1000, fuel=0,
    )
    with pytest.raises(InvalidOrderError):
        calculate_order_financials(inputs, commission_pct=0.0)