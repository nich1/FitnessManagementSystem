from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from src.database import get_db
from src.domain.Workout.workout_service import WorkoutService
from src.domain.Workout.schemas import Workout

workout_router = APIRouter(prefix="/workouts", tags=["Workouts"])


class WorkoutItemRequest(BaseModel):
    exercise_id: int | None = None
    movement_pattern_id: int | None = None


class WorkoutRequest(BaseModel):
    name: str
    description: str | None = None
    items: list[WorkoutItemRequest]


@workout_router.get("/", response_model=list[Workout])
def get_all_workouts(db: Session = Depends(get_db)):
    return WorkoutService().get_all_workouts(db)


@workout_router.get("/{workout_id}", response_model=Workout)
def get_workout(workout_id: int, db: Session = Depends(get_db)):
    workout = WorkoutService().get_workout(db, workout_id)
    if workout is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout


@workout_router.post("/", response_model=Workout)
def create_workout(workout: WorkoutRequest, db: Session = Depends(get_db)):
    items = [{"exercise_id": item.exercise_id, "movement_pattern_id": item.movement_pattern_id} for item in workout.items]
    return WorkoutService().create_workout(db, workout.name, workout.description, items)


@workout_router.put("/{workout_id}", response_model=Workout)
def update_workout(workout_id: int, workout: WorkoutRequest, db: Session = Depends(get_db)):
    items = [{"exercise_id": item.exercise_id, "movement_pattern_id": item.movement_pattern_id} for item in workout.items]
    updated = WorkoutService().update_workout(db, workout_id, workout.name, workout.description, items)
    if updated is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    return updated


@workout_router.delete("/{workout_id}", response_model=Workout)
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    deleted = WorkoutService().delete_workout(db, workout_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    return deleted


@workout_router.delete("/")
def delete_all_workouts(db: Session = Depends(get_db)):
    WorkoutService().delete_all_workouts(db)
    return Response(status_code=204)

