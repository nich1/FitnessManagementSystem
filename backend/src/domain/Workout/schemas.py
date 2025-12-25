from pydantic import BaseModel
from src.domain.Exercise.schemas import Exercise
from src.domain.MovementPattern.schemas import MovementPattern


class WorkoutItem(BaseModel):
    """An item in a workout template - either an exercise or a movement pattern"""
    id: int
    position: int
    exercise: Exercise | None = None
    movement_pattern: MovementPattern | None = None


class Workout(BaseModel):
    """A workout template - an ordered collection of exercises and movement patterns"""
    id: int
    name: str
    description: str | None = None
    items: list[WorkoutItem]
