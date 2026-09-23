from pydantic import BaseModel, Field


class RestaurantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    commission_pct: float = Field(ge=0, le=1)  # 0.10 = 10%, not "10"


class RestaurantResponse(BaseModel):
    id: str
    name: str
    commission_pct: float
    active: bool