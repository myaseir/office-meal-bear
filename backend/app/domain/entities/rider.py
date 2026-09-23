from dataclasses import dataclass


@dataclass(frozen=True)
class Rider:
    id: str
    name: str
    active: bool
    is_platform_rider: bool = False