from dataclasses import dataclass


@dataclass(frozen=True)
class Restaurant:
    id: str
    name: str
    commission_pct: float  # e.g. 0.10 for 10%
    active: bool