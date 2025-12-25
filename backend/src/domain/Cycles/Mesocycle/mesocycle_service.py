from sqlalchemy.orm import Session
from src.domain.Cycles.Mesocycle.repository import MesocycleRepository
from src.domain.Cycles.Mesocycle.schemas import Mesocycle, MicrocycleRequest
from datetime import date


class MesocycleService:
    def get_mesocycle(self, db: Session, mesocycle_id: int) -> Mesocycle | None:
        return MesocycleRepository(db).get_by_id(mesocycle_id)

    def get_all_mesocycles(self, db: Session) -> list[Mesocycle]:
        return MesocycleRepository(db).get_all()

    def create_mesocycle(
        self,
        db: Session,
        name: str,
        description: str | None,
        start_date: date,
        end_date: date,
        microcycles: list[MicrocycleRequest],
    ) -> Mesocycle:
        return MesocycleRepository(db).create(name, description, start_date, end_date, microcycles)

    def update_mesocycle(
        self,
        db: Session,
        mesocycle_id: int,
        name: str,
        description: str | None,
        start_date: date,
        end_date: date,
        microcycles: list[MicrocycleRequest],
    ) -> Mesocycle | None:
        return MesocycleRepository(db).update(mesocycle_id, name, description, start_date, end_date, microcycles)

    def delete_mesocycle(self, db: Session, mesocycle_id: int) -> Mesocycle | None:
        return MesocycleRepository(db).delete(mesocycle_id)

    def delete_all_mesocycles(self, db: Session) -> list[Mesocycle]:
        return MesocycleRepository(db).delete_all()

