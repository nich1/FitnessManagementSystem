from sqlalchemy.orm import Session
from src.domain.Exercise.models import ExerciseModel
from src.domain.Exercise.schemas import Exercise


class ExerciseRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: ExerciseModel) -> Exercise:
        return Exercise(
            id=model.id,
            name=model.name,
            movement_pattern_id=model.movement_pattern_id,
            notes=model.notes
        )

    def get_by_id(self, exercise_id: int) -> Exercise | None:
        model = self.db.query(ExerciseModel).filter(ExerciseModel.id == exercise_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Exercise]:
        models = self.db.query(ExerciseModel).all()
        return [self._model_to_schema(m) for m in models]

    def get_by_movement_pattern(self, movement_pattern_id: int) -> list[Exercise]:
        models = self.db.query(ExerciseModel).filter(
            ExerciseModel.movement_pattern_id == movement_pattern_id
        ).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, name: str, movement_pattern_id: int | None = None, notes: str | None = None) -> Exercise:
        model = ExerciseModel(
            name=name,
            movement_pattern_id=movement_pattern_id,
            notes=notes
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, exercise_id: int, name: str, movement_pattern_id: int | None = None, notes: str | None = None) -> Exercise | None:
        model = self.db.query(ExerciseModel).filter(ExerciseModel.id == exercise_id).first()
        if model is None:
            return None
        
        model.name = name
        model.movement_pattern_id = movement_pattern_id
        model.notes = notes
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, exercise_id: int) -> Exercise | None:
        model = self.db.query(ExerciseModel).filter(ExerciseModel.id == exercise_id).first()
        if model is None:
            return None
        exercise = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return exercise

    def delete_all(self) -> list[Exercise]:
        models = self.db.query(ExerciseModel).all()
        exercises = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return exercises
