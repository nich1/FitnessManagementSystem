from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from src.database import get_db
from src.domain.Activity.activity_service import ActivityService
from src.domain.Activity.schemas import Activity
from src.domain.Exercise.schemas import Unit

activity_router = APIRouter(prefix="/activities", tags=["Activities"])


class ActivitySetRequest(BaseModel):
    reps: int
    weight: float
    unit: Unit | None = None
    rir: int | None = None
    notes: str | None = None


class ActivityExerciseRequest(BaseModel):
    exercise_id: int
    session_notes: str | None = None
    sets: list[ActivitySetRequest]


class ActivityRequest(BaseModel):
    workout_id: int | None = None
    time: datetime
    notes: str | None = None
    exercises: list[ActivityExerciseRequest]


@activity_router.get("/", response_model=list[Activity])
def get_all_activities(db: Session = Depends(get_db)):
    return ActivityService().get_all_activities(db)


@activity_router.get("/{activity_id}", response_model=Activity)
def get_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = ActivityService().get_activity(db, activity_id)
    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@activity_router.post("/", response_model=Activity)
def create_activity(activity: ActivityRequest, db: Session = Depends(get_db)):
    exercises = []
    for ex in activity.exercises:
        exercises.append({
            "exercise_id": ex.exercise_id,
            "session_notes": ex.session_notes,
            "sets": [{"reps": s.reps, "weight": s.weight, "unit": s.unit.value if s.unit else None, "rir": s.rir, "notes": s.notes} for s in ex.sets]
        })
    return ActivityService().create_activity(db, activity.time, activity.workout_id, activity.notes, exercises)


@activity_router.put("/{activity_id}", response_model=Activity)
def update_activity(activity_id: int, activity: ActivityRequest, db: Session = Depends(get_db)):
    exercises = []
    for ex in activity.exercises:
        exercises.append({
            "exercise_id": ex.exercise_id,
            "session_notes": ex.session_notes,
            "sets": [{"reps": s.reps, "weight": s.weight, "unit": s.unit.value if s.unit else None, "rir": s.rir, "notes": s.notes} for s in ex.sets]
        })
    updated = ActivityService().update_activity(db, activity_id, activity.time, activity.workout_id, activity.notes, exercises)
    if updated is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return updated


@activity_router.delete("/{activity_id}", response_model=Activity)
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    deleted = ActivityService().delete_activity(db, activity_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return deleted


@activity_router.delete("/", status_code=204)
def delete_all_activities(db: Session = Depends(get_db)):
    ActivityService().delete_all_activities(db)
    return Response(status_code=204)

