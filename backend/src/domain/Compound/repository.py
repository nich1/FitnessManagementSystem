from sqlalchemy.orm import Session
from src.domain.Compound.models import CompoundModel
from src.domain.Compound.schemas import Compound, CompoundUnit


class CompoundRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: CompoundModel) -> Compound:
        return Compound(
            id=model.id,
            name=model.name,
            unit=CompoundUnit(model.unit)
        )

    def get_by_id(self, compound_id: int) -> Compound | None:
        model = self.db.query(CompoundModel).filter(CompoundModel.id == compound_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Compound]:
        models = self.db.query(CompoundModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, name: str, unit: CompoundUnit) -> Compound:
        model = CompoundModel(
            name=name,
            unit=unit.value
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, compound_id: int, name: str, unit: CompoundUnit) -> Compound | None:
        model = self.db.query(CompoundModel).filter(CompoundModel.id == compound_id).first()
        if model is None:
            return None
        
        model.name = name
        model.unit = unit.value
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, compound_id: int) -> Compound | None:
        model = self.db.query(CompoundModel).filter(CompoundModel.id == compound_id).first()
        if model is None:
            return None
        compound = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return compound

    def delete_all(self) -> list[Compound]:
        models = self.db.query(CompoundModel).all()
        compounds = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return compounds

