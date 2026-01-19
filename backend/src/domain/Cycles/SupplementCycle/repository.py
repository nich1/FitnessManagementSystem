from sqlalchemy.orm import Session
from src.domain.Cycles.SupplementCycle.models import (
    SupplementCycleModel,
    SupplementCycleDayModel,
    SupplementCycleDayItemModel,
)
from src.domain.Cycles.SupplementCycle.schemas import (
    SupplementCycle,
    SupplementCycleDay,
    SupplementCycleDayItem,
    SupplementCycleDayRequest,
)


class SupplementCycleRepository:
    def __init__(self, db: Session):
        self.db = db

    def _item_model_to_schema(self, model: SupplementCycleDayItemModel) -> SupplementCycleDayItem:
        return SupplementCycleDayItem(
            id=model.id,
            supplement_id=model.supplement_id,
            compound_id=model.compound_id,
            amount=model.amount,
        )

    def _day_model_to_schema(self, model: SupplementCycleDayModel) -> SupplementCycleDay:
        return SupplementCycleDay(
            id=model.id,
            position=model.position,
            items=[self._item_model_to_schema(item) for item in model.items],
        )

    def _model_to_schema(self, model: SupplementCycleModel) -> SupplementCycle:
        return SupplementCycle(
            id=model.id,
            name=model.name,
            description=model.description,
            days=[self._day_model_to_schema(d) for d in model.days],
        )

    def get_by_id(self, supplement_cycle_id: int) -> SupplementCycle | None:
        model = self.db.query(SupplementCycleModel).filter(
            SupplementCycleModel.id == supplement_cycle_id
        ).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[SupplementCycle]:
        models = self.db.query(SupplementCycleModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(
        self,
        name: str,
        description: str | None,
        days: list[SupplementCycleDayRequest],
    ) -> SupplementCycle:
        model = SupplementCycleModel(
            name=name,
            description=description,
        )
        self.db.add(model)
        self.db.flush()

        for position, day in enumerate(days):
            day_model = SupplementCycleDayModel(
                supplement_cycle_id=model.id,
                position=position,
            )
            self.db.add(day_model)
            self.db.flush()

            for item in day.items:
                item_model = SupplementCycleDayItemModel(
                    day_id=day_model.id,
                    supplement_id=item.supplement_id,
                    compound_id=item.compound_id,
                    amount=item.amount,
                )
                self.db.add(item_model)

        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(
        self,
        supplement_cycle_id: int,
        name: str,
        description: str | None,
        days: list[SupplementCycleDayRequest],
    ) -> SupplementCycle | None:
        model = self.db.query(SupplementCycleModel).filter(
            SupplementCycleModel.id == supplement_cycle_id
        ).first()
        if model is None:
            return None

        model.name = name
        model.description = description

        # Delete existing days through ORM (this triggers cascade="all, delete-orphan")
        model.days.clear()
        self.db.flush()

        # Add new days
        for position, day in enumerate(days):
            day_model = SupplementCycleDayModel(
                supplement_cycle_id=model.id,
                position=position,
            )
            self.db.add(day_model)
            self.db.flush()

            for item in day.items:
                item_model = SupplementCycleDayItemModel(
                    day_id=day_model.id,
                    supplement_id=item.supplement_id,
                    compound_id=item.compound_id,
                    amount=item.amount,
                )
                self.db.add(item_model)

        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, supplement_cycle_id: int) -> SupplementCycle | None:
        model = self.db.query(SupplementCycleModel).filter(
            SupplementCycleModel.id == supplement_cycle_id
        ).first()
        if model is None:
            return None
        supplement_cycle = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return supplement_cycle

    def delete_all(self) -> list[SupplementCycle]:
        models = self.db.query(SupplementCycleModel).all()
        supplement_cycles = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return supplement_cycles

