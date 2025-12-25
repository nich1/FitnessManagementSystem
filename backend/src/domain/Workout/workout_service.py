from sqlalchemy.orm import Session
from src.domain.Workout.schemas import Workout
from src.domain.Workout.repository import WorkoutRepository


class WorkoutService:
    def get_workout(self, db: Session, workout_id: int) -> Workout | None:
        return WorkoutRepository(db).get_by_id(workout_id)

    def get_all_workouts(self, db: Session) -> list[Workout]:
        return WorkoutRepository(db).get_all()

    def create_workout(self, db: Session, name: str, description: str | None, items: list[dict]) -> Workout:
        return WorkoutRepository(db).create(name, description, items)

    def update_workout(self, db: Session, workout_id: int, name: str, description: str | None, items: list[dict]) -> Workout | None:
        return WorkoutRepository(db).update(workout_id, name, description, items)

    def delete_workout(self, db: Session, workout_id: int) -> Workout | None:
        return WorkoutRepository(db).delete(workout_id)

    def delete_all_workouts(self, db: Session) -> list[Workout]:
        return WorkoutRepository(db).delete_all()

