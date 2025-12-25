from sqlalchemy.orm import Session
from src.domain.Stress.models import StressModel
from src.domain.Stress.schemas import Stress, StressLevel
from src.api.schemas import StressRequest


class StressRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: StressModel) -> Stress:
        return Stress(
            id=model.id,
            timestamp=model.timestamp,
            level=StressLevel(model.level),
            notes=model.notes
        )

    def get_by_id(self, stress_id: int) -> Stress | None:
        model = self.db.query(StressModel).filter(StressModel.id == stress_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Stress]:
        models = self.db.query(StressModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, stress: StressRequest) -> Stress:
        model = StressModel(
            timestamp=stress.timestamp,
            level=stress.level.value,
            notes=stress.notes
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, stress_id: int, stress: StressRequest) -> Stress | None:
        model = self.db.query(StressModel).filter(StressModel.id == stress_id).first()
        if model is None:
            return None
        
        model.timestamp = stress.timestamp
        model.level = stress.level.value
        model.notes = stress.notes
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, stress_id: int) -> Stress | None:
        model = self.db.query(StressModel).filter(StressModel.id == stress_id).first()
        if model is None:
            return None
        stress = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return stress

    def delete_all(self) -> list[Stress]:
        models = self.db.query(StressModel).all()
        stresses = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return stresses

