from sqlalchemy.orm import Session
from src.domain.Hydration.repository import HydrationRepository, CupRepository
from src.domain.Hydration.schemas import Hydration, Cup, HydrationUnit


class CupService:
    def get_cup(self, db: Session, cup_id: int) -> Cup | None:
        return CupRepository(db).get_by_id(cup_id)

    def get_all_cups(self, db: Session) -> list[Cup]:
        return CupRepository(db).get_all()

    def create_cup(self, db: Session, name: str, amount: float, unit: HydrationUnit) -> Cup:
        return CupRepository(db).create(name, amount, unit)

    def update_cup(self, db: Session, cup_id: int, name: str, amount: float, unit: HydrationUnit) -> Cup | None:
        return CupRepository(db).update(cup_id, name, amount, unit)

    def delete_cup(self, db: Session, cup_id: int) -> Cup | None:
        return CupRepository(db).delete(cup_id)

    def delete_all_cups(self, db: Session) -> list[Cup]:
        return CupRepository(db).delete_all()


class HydrationService:
    def get_hydration(self, db: Session, hydration_id: int) -> Hydration | None:
        return HydrationRepository(db).get_by_id(hydration_id)

    def get_all_hydration(self, db: Session) -> list[Hydration]:
        return HydrationRepository(db).get_all()

    def create_hydration(self, db: Session, timestamp, cup_id: int, servings: float = 1.0) -> Hydration:
        return HydrationRepository(db).create(timestamp, cup_id, servings)

    def update_hydration(self, db: Session, hydration_id: int, timestamp, cup_id: int, servings: float) -> Hydration | None:
        return HydrationRepository(db).update(hydration_id, timestamp, cup_id, servings)

    def delete_hydration(self, db: Session, hydration_id: int) -> Hydration | None:
        return HydrationRepository(db).delete(hydration_id)

    def delete_all_hydration(self, db: Session) -> list[Hydration]:
        return HydrationRepository(db).delete_all()
