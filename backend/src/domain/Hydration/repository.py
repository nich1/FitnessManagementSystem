from sqlalchemy.orm import Session
from src.domain.Hydration.models import HydrationModel, CupModel
from src.domain.Hydration.schemas import Hydration, Cup, HydrationUnit


class CupRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: CupModel) -> Cup:
        return Cup(
            id=model.id,
            name=model.name,
            amount=model.amount,
            unit=HydrationUnit(model.unit)
        )

    def get_by_id(self, cup_id: int) -> Cup | None:
        model = self.db.query(CupModel).filter(CupModel.id == cup_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Cup]:
        models = self.db.query(CupModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, name: str, amount: float, unit: HydrationUnit) -> Cup:
        model = CupModel(
            name=name,
            amount=amount,
            unit=unit.value
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, cup_id: int, name: str, amount: float, unit: HydrationUnit) -> Cup | None:
        model = self.db.query(CupModel).filter(CupModel.id == cup_id).first()
        if model is None:
            return None
        
        model.name = name
        model.amount = amount
        model.unit = unit.value
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, cup_id: int) -> Cup | None:
        model = self.db.query(CupModel).filter(CupModel.id == cup_id).first()
        if model is None:
            return None
        cup = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return cup

    def delete_all(self) -> list[Cup]:
        models = self.db.query(CupModel).all()
        cups = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return cups


class HydrationRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: HydrationModel) -> Hydration:
        cup = Cup(
            id=model.cup.id,
            name=model.cup.name,
            amount=model.cup.amount,
            unit=HydrationUnit(model.cup.unit)
        )
        return Hydration(
            id=model.id,
            timestamp=model.timestamp,
            cup=cup,
            servings=model.servings
        )

    def get_by_id(self, hydration_id: int) -> Hydration | None:
        model = self.db.query(HydrationModel).filter(HydrationModel.id == hydration_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Hydration]:
        models = self.db.query(HydrationModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, timestamp, cup_id: int, servings: float = 1.0) -> Hydration:
        model = HydrationModel(
            timestamp=timestamp,
            cup_id=cup_id,
            servings=servings
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, hydration_id: int, timestamp, cup_id: int, servings: float) -> Hydration | None:
        model = self.db.query(HydrationModel).filter(HydrationModel.id == hydration_id).first()
        if model is None:
            return None
        
        model.timestamp = timestamp
        model.cup_id = cup_id
        model.servings = servings
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, hydration_id: int) -> Hydration | None:
        model = self.db.query(HydrationModel).filter(HydrationModel.id == hydration_id).first()
        if model is None:
            return None
        hydration = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return hydration

    def delete_all(self) -> list[Hydration]:
        models = self.db.query(HydrationModel).all()
        hydrations = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return hydrations
