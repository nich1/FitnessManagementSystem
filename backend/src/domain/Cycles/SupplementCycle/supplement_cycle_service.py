from sqlalchemy.orm import Session
from src.domain.Cycles.SupplementCycle.repository import SupplementCycleRepository
from src.domain.Cycles.SupplementCycle.schemas import SupplementCycle, SupplementCycleDayRequest


class SupplementCycleService:
    def get_supplement_cycle(self, db: Session, supplement_cycle_id: int) -> SupplementCycle | None:
        return SupplementCycleRepository(db).get_by_id(supplement_cycle_id)

    def get_all_supplement_cycles(self, db: Session) -> list[SupplementCycle]:
        return SupplementCycleRepository(db).get_all()

    def create_supplement_cycle(
        self,
        db: Session,
        name: str,
        description: str | None,
        days: list[SupplementCycleDayRequest],
    ) -> SupplementCycle:
        return SupplementCycleRepository(db).create(name, description, days)

    def update_supplement_cycle(
        self,
        db: Session,
        supplement_cycle_id: int,
        name: str,
        description: str | None,
        days: list[SupplementCycleDayRequest],
    ) -> SupplementCycle | None:
        return SupplementCycleRepository(db).update(supplement_cycle_id, name, description, days)

    def delete_supplement_cycle(self, db: Session, supplement_cycle_id: int) -> SupplementCycle | None:
        return SupplementCycleRepository(db).delete(supplement_cycle_id)

    def delete_all_supplement_cycles(self, db: Session) -> list[SupplementCycle]:
        return SupplementCycleRepository(db).delete_all()

