from sqlalchemy.orm import Session
from src.domain.Stress.schemas import Stress
from src.domain.Stress.repository import StressRepository
from src.api.schemas import StressRequest


class StressService:
    def get_stress(self, db: Session, stress_id: int) -> Stress | None:
        return StressRepository(db).get_by_id(stress_id)

    def get_all_stress(self, db: Session) -> list[Stress]:
        return StressRepository(db).get_all()

    def create_stress(self, db: Session, stress: StressRequest) -> Stress:
        return StressRepository(db).create(stress)

    def update_stress(self, db: Session, stress_id: int, stress: StressRequest) -> Stress | None:
        return StressRepository(db).update(stress_id, stress)

    def delete_stress(self, db: Session, stress_id: int) -> Stress | None:
        return StressRepository(db).delete(stress_id)

    def delete_all_stress(self, db: Session) -> list[Stress]:
        return StressRepository(db).delete_all()

