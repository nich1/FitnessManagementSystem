from pydantic import BaseModel


class SupplementCycleDayItemRequest(BaseModel):
    """A single supplement or compound entry for a day"""
    supplement_id: int | None = None
    compound_id: int | None = None
    amount: float


class SupplementCycleDayItem(BaseModel):
    """A single supplement or compound entry for a day (with id)"""
    id: int
    supplement_id: int | None = None
    compound_id: int | None = None
    amount: float


class SupplementCycleDayRequest(BaseModel):
    """A day in a supplement cycle (request)"""
    items: list[SupplementCycleDayItemRequest]


class SupplementCycleDay(BaseModel):
    """A day in a supplement cycle"""
    id: int
    position: int
    items: list[SupplementCycleDayItem]


class SupplementCycleRequest(BaseModel):
    name: str
    description: str | None = None
    days: list[SupplementCycleDayRequest]


class SupplementCycle(BaseModel):
    id: int
    name: str
    description: str | None = None
    days: list[SupplementCycleDay]
