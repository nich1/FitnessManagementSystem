from sqlalchemy.orm import Session
from src.domain.Exercise.schemas import Exercise
from src.domain.Exercise.repository import ExerciseRepository


class ExerciseService:
    def __init__(self, db: Session):
        self.repository = ExerciseRepository(db)

    def get_exercise(self, exercise_id: int) -> Exercise | None:
        return self.repository.get_by_id(exercise_id)

    def get_all_exercises(self) -> list[Exercise]:
        return self.repository.get_all()

    def get_exercises_by_movement_pattern(self, movement_pattern_id: int) -> list[Exercise]:
        return self.repository.get_by_movement_pattern(movement_pattern_id)

    def create_exercise(self, name: str, movement_pattern_id: int | None = None, notes: str | None = None) -> Exercise:
        return self.repository.create(name, movement_pattern_id, notes)

    def update_exercise(self, exercise_id: int, name: str, movement_pattern_id: int | None = None, notes: str | None = None) -> Exercise | None:
        return self.repository.update(exercise_id, name, movement_pattern_id, notes)

    def delete_exercise(self, exercise_id: int) -> Exercise | None:
        return self.repository.delete(exercise_id)

    def delete_all_exercises(self) -> bool:
        deleted = self.repository.delete_all()
        if deleted is None:
            return False
        return True
