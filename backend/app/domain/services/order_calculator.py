from app.domain.entities.order import OrderCalculatedFields, OrderInputs


class InvalidOrderError(ValueError):
    """Raised when order inputs violate a business rule (not just a type/shape error)."""


CALC_VERSION = 2


def calculate_order_financials(
    inputs: OrderInputs,
    commission_pct: float,
    is_platform_rider: bool = False,
) -> OrderCalculatedFields:
    final_delivery = inputs.delivery_charge + inputs.adjustment

    if final_delivery < 0:
        raise InvalidOrderError(
            f"Final delivery cannot be negative (delivery_charge={inputs.delivery_charge}, "
            f"adjustment={inputs.adjustment} -> final_delivery={final_delivery}). "
            "Check the adjustment value."
        )

    customer_total = inputs.food_amount + final_delivery
    commission_amount = inputs.food_amount * commission_pct
    restaurant_payable = inputs.food_amount - commission_amount

    # Raw overcharge — kept for auditing, never used directly in payout math.
    overcharge_tip = max(0.0, inputs.amount_received - customer_total)
    amount_due = max(0.0, customer_total - inputs.amount_received)

    # Effective tip: manual entry overrides overcharge; otherwise falls back to it.
    effective_tip = inputs.rider_tip if inputs.rider_tip > 0 else overcharge_tip

    rider_earning = inputs.fuel + 0.5 * (final_delivery - inputs.fuel) + effective_tip

    # For a platform-owned rider (e.g. "Self"), the platform doesn't pay itself:
    # rider_earning is still computed and returned for record-keeping/tracking,
    # but it stays inside meal_bear_revenue instead of being subtracted out.
    if is_platform_rider:
        meal_bear_revenue = commission_amount + final_delivery + effective_tip
    else:
        meal_bear_revenue = commission_amount + final_delivery - rider_earning
    return OrderCalculatedFields(
        final_delivery=round(final_delivery, 2),
        customer_total=round(customer_total, 2),
        commission_amount=round(commission_amount, 2),
        restaurant_payable=round(restaurant_payable, 2),
        tip=round(overcharge_tip, 2),
        effective_tip=round(effective_tip, 2),
        amount_due=round(amount_due, 2),
        rider_earning=round(rider_earning, 2),
        meal_bear_revenue=round(meal_bear_revenue, 2),
    )