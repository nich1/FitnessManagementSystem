from pydantic import BaseModel
from enum import Enum


class CarbCycleDayType(str, Enum):
    LOWEST = "lowest"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    HIGHEST = "highest"


class CarbCycleDayRequest(BaseModel):
    day_type: CarbCycleDayType
    carbs: float


class CarbCycleDay(BaseModel):
    id: int
    day_type: CarbCycleDayType
    carbs: float
    position: int


class CarbCycleRequest(BaseModel):
    name: str
    description: str | None = None
    days: list[CarbCycleDayRequest]


class CarbCycle(BaseModel):
    id: int
    name: str
    description: str | None = None
    days: list[CarbCycleDay]
