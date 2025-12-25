from sqlalchemy.orm import Session
from src.domain.Cycles.CarbCycle.models import CarbCycleModel, CarbCycleDayModel
from src.domain.Cycles.CarbCycle.schemas import (
    CarbCycle,
    CarbCycleDay,
    CarbCycleDayType,
    CarbCycleDayRequest,
)


class CarbCycleRepository:
    def __init__(self, db: Session):
        self.db = db

    def _day_model_to_schema(self, model: CarbCycleDayModel) -> CarbCycleDay:
        return CarbCycleDay(
            id=model.id,
            day_type=CarbCycleDayType(model.day_type),
            carbs=model.carbs,
            position=model.position,
        )

    def _model_to_schema(self, model: CarbCycleModel) -> CarbCycle:
        return CarbCycle(
            id=model.id,
            name=model.name,
            description=model.description,
            days=[self._day_model_to_schema(d) for d in model.days],
        )

    def get_by_id(self, carb_cycle_id: int) -> CarbCycle | None:
        model = self.db.query(CarbCycleModel).filter(CarbCycleModel.id == carb_cycle_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[CarbCycle]:
        models = self.db.query(CarbCycleModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(
        self,
        name: str,
        description: str | None,
        days: list[CarbCycleDayRequest],
    ) -> CarbCycle:
        model = CarbCycleModel(
            name=name,
            description=description,
        )
        self.db.add(model)
        self.db.flush()  # Get the ID

        for position, day in enumerate(days):
            day_model = CarbCycleDayModel(
                carb_cycle_id=model.id,
                day_type=day.day_type.value,
                carbs=day.carbs,
                position=position,
            )
            self.db.add(day_model)

        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(
        self,
        carb_cycle_id: int,
        name: str,
        description: str | None,
        days: list[CarbCycleDayRequest],
    ) -> CarbCycle | None:
        model = self.db.query(CarbCycleModel).filter(CarbCycleModel.id == carb_cycle_id).first()
        if model is None:
            return None

        model.name = name
        model.description = description

        # Delete existing days
        self.db.query(CarbCycleDayModel).filter(
            CarbCycleDayModel.carb_cycle_id == carb_cycle_id
        ).delete()

        # Add new days
        for position, day in enumerate(days):
            day_model = CarbCycleDayModel(
                carb_cycle_id=model.id,
                day_type=day.day_type.value,
                carbs=day.carbs,
                position=position,
            )
            self.db.add(day_model)

        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, carb_cycle_id: int) -> CarbCycle | None:
        model = self.db.query(CarbCycleModel).filter(CarbCycleModel.id == carb_cycle_id).first()
        if model is None:
            return None
        carb_cycle = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return carb_cycle

    def delete_all(self) -> list[CarbCycle]:
        models = self.db.query(CarbCycleModel).all()
        carb_cycles = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return carb_cycles

