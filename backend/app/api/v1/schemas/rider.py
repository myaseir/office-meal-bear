from pydantic import BaseModel, Field


class RiderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    is_platform_rider: bool = False


class RiderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    active: bool | None = None
    is_platform_rider: bool | None = None


class RiderResponse(BaseModel):
    id: str
    name: str
    active: bool
    is_platform_rider: bool