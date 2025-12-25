from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from src.domain.Exercise.schemas import Exercise
from src.domain.Exercise.exercise_service import ExerciseService
from src.database import get_db

exercise_router = APIRouter(prefix="/exercises", tags=["Exercises"])


class ExerciseRequest(BaseModel):
    name: str
    movement_pattern_id: int | None = None
    notes: str | None = None


@exercise_router.get("/", response_model=list[Exercise])
async def get_all_exercises(db: Session = Depends(get_db)) -> list[Exercise]:
    return ExerciseService(db).get_all_exercises()


@exercise_router.get("/{id}", response_model=Exercise)
async def get_exercise(id: int, db: Session = Depends(get_db)) -> Exercise:
    exercise = ExerciseService(db).get_exercise(id)
    if exercise is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise


@exercise_router.post("/", response_model=Exercise)
async def create_exercise(exercise: ExerciseRequest, db: Session = Depends(get_db)) -> Exercise:
    return ExerciseService(db).create_exercise(exercise.name, exercise.movement_pattern_id, exercise.notes)


@exercise_router.put("/{id}", response_model=Exercise)
async def update_exercise(id: int, exercise: ExerciseRequest, db: Session = Depends(get_db)) -> Exercise:
    updated = ExerciseService(db).update_exercise(id, exercise.name, exercise.movement_pattern_id, exercise.notes)
    if updated is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return updated


@exercise_router.delete("/{id}", response_model=Exercise)
async def delete_exercise(id: int, db: Session = Depends(get_db)) -> Exercise:
    deleted = ExerciseService(db).delete_exercise(id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return deleted


@exercise_router.delete("/", status_code=204)
async def delete_all_exercises(db: Session = Depends(get_db)):
    ExerciseService(db).delete_all_exercises()

