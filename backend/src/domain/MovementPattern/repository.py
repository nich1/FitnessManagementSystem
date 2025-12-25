from sqlalchemy.orm import Session
from src.domain.MovementPattern.models import MovementPatternModel
from src.domain.MovementPattern.schemas import MovementPattern, MovementPatternWithExercises


class MovementPatternRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: MovementPatternModel) -> MovementPattern:
        return MovementPattern(
            id=model.id,
            name=model.name,
            description=model.description
        )

    def _model_to_schema_with_exercises(self, model: MovementPatternModel) -> MovementPatternWithExercises:
        return MovementPatternWithExercises(
            id=model.id,
            name=model.name,
            description=model.description,
            exercise_ids=[e.id for e in model.exercises]
        )

    def get_by_id(self, pattern_id: int) -> MovementPattern | None:
        model = self.db.query(MovementPatternModel).filter(MovementPatternModel.id == pattern_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[MovementPatternWithExercises]:
        models = self.db.query(MovementPatternModel).all()
        return [self._model_to_schema_with_exercises(m) for m in models]

    def create(self, name: str, description: str | None = None) -> MovementPattern:
        model = MovementPatternModel(
            name=name,
            description=description
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, pattern_id: int, name: str, description: str | None = None) -> MovementPattern | None:
        model = self.db.query(MovementPatternModel).filter(MovementPatternModel.id == pattern_id).first()
        if model is None:
            return None
        
        model.name = name
        model.description = description
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, pattern_id: int) -> MovementPattern | None:
        model = self.db.query(MovementPatternModel).filter(MovementPatternModel.id == pattern_id).first()
        if model is None:
            return None
        pattern = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return pattern

    def delete_all(self) -> list[MovementPattern]:
        models = self.db.query(MovementPatternModel).all()
        patterns = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return patterns

