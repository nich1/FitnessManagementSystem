from pydantic import BaseModel
from datetime import datetime
from src.domain.Exercise.schemas import Exercise, Unit


class ActivitySet(BaseModel):
    """A single set performed during an activity"""
    id: int
    reps: int
    weight: float
    unit: Unit | None = None
    rir: int | None = None  # Reps In Reserve
    notes: str | None = None


class ActivityExercise(BaseModel):
    """An exercise performed during an activity with its sets"""
    id: int
    exercise: Exercise
    position: int
    session_notes: str | None = None  # Notes specific to this session
    sets: list[ActivitySet]


class ActivityWorkout(BaseModel):
    """Lightweight workout info for activity display"""
    id: int
    name: str
    description: str | None = None


class Activity(BaseModel):
    """An activity is a workout instance for a specific log entry"""
    id: int
    workout_id: int | None = None
    workout: ActivityWorkout | None = None  # The workout template info
    time: datetime
    notes: str | None = None
    exercises: list[ActivityExercise]

