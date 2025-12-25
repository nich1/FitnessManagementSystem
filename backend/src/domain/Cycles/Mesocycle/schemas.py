from pydantic import BaseModel
from datetime import date
from src.domain.Workout.schemas import Workout


class MicrocycleDayRequest(BaseModel):
    workout_id: int  # 0 for rest day


class MicrocycleDay(BaseModel):
    id: int
    position: int
    workout_id: int
    workout: Workout | None = None  # populated when returning full data


class MicrocycleRequest(BaseModel):
    name: str
    description: str | None = None
    workout_ids: list[int]  # List of workout_ids in order (0 = rest day)


class Microcycle(BaseModel):
    id: int
    name: str
    position: int
    description: str | None = None
    workouts: list[Workout]  # Populated with full workout objects


class MesocycleRequest(BaseModel):
    name: str
    description: str | None = None
    start_date: date
    end_date: date
    microcycles: list[MicrocycleRequest]


class Mesocycle(BaseModel):
    id: int
    name: str
    description: str | None = None
    start_date: date
    end_date: date
    microcycles: list[Microcycle]
