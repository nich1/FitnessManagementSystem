from pydantic import BaseModel
from typing import Literal, Annotated, Union
from datetime import datetime
from enum import Enum


class CardioType(str, Enum):
    INCLINE_WALKING = "incline_walking"
    SPRINTS = "sprints"
    WALKING = "walking"
    RUNNING = "running"
    CYCLING = "cycling"
    SWIMMING = "swimming"
    OTHER = "other"


# Base class for all cardio exercises
class CardioExerciseBase(BaseModel):
    duration_minutes: int | None = None


# Specific cardio types with their unique fields
class InclineWalking(CardioExerciseBase):
    type: Literal["incline_walking"] = "incline_walking"
    speed: float  # mph or km/h
    incline: float  # percentage


class Sprints(CardioExerciseBase):
    type: Literal["sprints"] = "sprints"
    num_sprints: int
    sprint_duration_seconds: int | None = None
    rest_duration_seconds: int | None = None


class Walking(CardioExerciseBase):
    type: Literal["walking"] = "walking"
    # duration_minutes inherited from base


class Running(CardioExerciseBase):
    type: Literal["running"] = "running"
    distance: float | None = None  # miles or km
    pace: str | None = None  # e.g., "8:30" per mile


class Cycling(CardioExerciseBase):
    type: Literal["cycling"] = "cycling"
    distance: float | None = None
    resistance: int | None = None


class Swimming(CardioExerciseBase):
    type: Literal["swimming"] = "swimming"
    laps: int | None = None
    stroke: str | None = None  # freestyle, backstroke, etc.


class Other(CardioExerciseBase):
    type: Literal["other"] = "other"
    description: str  # free-form description of the cardio activity


# Discriminated union - Pydantic will use the "type" field to determine which class to use
CardioExercise = Annotated[
    Union[InclineWalking, Sprints, Walking, Running, Cycling, Swimming, Other],
    "type"
]


class Cardio(BaseModel):
    id: int
    name: str
    time: datetime
    exercise: CardioExercise
