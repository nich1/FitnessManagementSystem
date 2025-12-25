from sqlalchemy.orm import Session
from src.domain.Cardio.models import CardioModel
from src.domain.Cardio.schemas import (
    Cardio, CardioExercise, 
    InclineWalking, Sprints, Walking, Running, Cycling, Swimming, Other
)
from src.api.schemas import CardioRequest


class CardioRepository:
    def __init__(self, db: Session):
        self.db = db

    def _json_to_exercise(self, exercise_type: str, data: dict) -> CardioExercise:
        """Convert stored JSON back to the appropriate CardioExercise type"""
        type_map = {
            "incline_walking": InclineWalking,
            "sprints": Sprints,
            "walking": Walking,
            "running": Running,
            "cycling": Cycling,
            "swimming": Swimming,
            "other": Other,
        }
        cls = type_map.get(exercise_type)
        if cls:
            return cls(**data)
        raise ValueError(f"Unknown cardio type: {exercise_type}")

    def _model_to_schema(self, model: CardioModel) -> Cardio:
        return Cardio(
            id=model.id,
            name=model.name,
            time=model.time,
            exercise=self._json_to_exercise(model.exercise_type, model.exercise_data)
        )

    def get_by_id(self, cardio_id: int) -> Cardio | None:
        model = self.db.query(CardioModel).filter(CardioModel.id == cardio_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Cardio]:
        models = self.db.query(CardioModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, cardio: CardioRequest) -> Cardio:
        model = CardioModel(
            name=cardio.name,
            time=cardio.time,
            exercise_type=cardio.exercise.type,
            exercise_data=cardio.exercise.model_dump()
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, cardio_id: int, cardio: CardioRequest) -> Cardio | None:
        model = self.db.query(CardioModel).filter(CardioModel.id == cardio_id).first()
        if model is None:
            return None
        
        model.name = cardio.name
        model.time = cardio.time
        model.exercise_type = cardio.exercise.type
        model.exercise_data = cardio.exercise.model_dump()
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, cardio_id: int) -> Cardio | None:
        model = self.db.query(CardioModel).filter(CardioModel.id == cardio_id).first()
        if model is None:
            return None
        cardio = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return cardio

    def delete_all(self) -> list[Cardio]:
        models = self.db.query(CardioModel).all()
        cardios = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return cardios

