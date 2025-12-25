from pydantic import BaseModel
from enum import Enum


class Unit(str, Enum):
    KG = "kg"
    LB = "lb"


class Exercise(BaseModel):
    id: int
    name: str
    movement_pattern_id: int | None = None
    notes: str | None = None  # Notes displayed in every log entry when added to workouts
