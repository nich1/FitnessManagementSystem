from sqlalchemy.orm import Session
from src.domain.Phase.models import PhaseModel
from src.domain.Phase.schemas import Phase
from src.api.schemas import PhaseRequest


class PhaseRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: PhaseModel) -> Phase:
        return Phase(
            id=model.id,
            name=model.name
        )

    def get_by_id(self, phase_id: int) -> Phase | None:
        model = self.db.query(PhaseModel).filter(PhaseModel.id == phase_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Phase]:
        models = self.db.query(PhaseModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, phase: PhaseRequest) -> Phase:
        model = PhaseModel(
            name=phase.name
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, phase_id: int, phase: PhaseRequest) -> Phase | None:
        model = self.db.query(PhaseModel).filter(PhaseModel.id == phase_id).first()
        if model is None:
            return None
        
        model.name = phase.name
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, phase_id: int) -> Phase | None:
        model = self.db.query(PhaseModel).filter(PhaseModel.id == phase_id).first()
        if model is None:
            return None
        phase = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return phase

    def delete_all(self) -> list[Phase]:
        models = self.db.query(PhaseModel).all()
        phases = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return phases

