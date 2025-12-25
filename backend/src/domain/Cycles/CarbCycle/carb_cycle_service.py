from sqlalchemy.orm import Session
from src.domain.Cycles.CarbCycle.repository import CarbCycleRepository
from src.domain.Cycles.CarbCycle.schemas import CarbCycle, CarbCycleDayRequest


class CarbCycleService:
    def get_carb_cycle(self, db: Session, carb_cycle_id: int) -> CarbCycle | None:
        return CarbCycleRepository(db).get_by_id(carb_cycle_id)

    def get_all_carb_cycles(self, db: Session) -> list[CarbCycle]:
        return CarbCycleRepository(db).get_all()

    def create_carb_cycle(
        self,
        db: Session,
        name: str,
        description: str | None,
        days: list[CarbCycleDayRequest],
    ) -> CarbCycle:
        return CarbCycleRepository(db).create(name, description, days)

    def update_carb_cycle(
        self,
        db: Session,
        carb_cycle_id: int,
        name: str,
        description: str | None,
        days: list[CarbCycleDayRequest],
    ) -> CarbCycle | None:
        return CarbCycleRepository(db).update(carb_cycle_id, name, description, days)

    def delete_carb_cycle(self, db: Session, carb_cycle_id: int) -> CarbCycle | None:
        return CarbCycleRepository(db).delete(carb_cycle_id)

    def delete_all_carb_cycles(self, db: Session) -> list[CarbCycle]:
        return CarbCycleRepository(db).delete_all()

