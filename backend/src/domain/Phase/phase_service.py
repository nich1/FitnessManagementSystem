from sqlalchemy.orm import Session
from src.domain.Phase.schemas import Phase
from src.domain.Phase.repository import PhaseRepository
from src.api.schemas import PhaseRequest


class PhaseService:
    def get_phase(self, db: Session, phase_id: int) -> Phase | None:
        return PhaseRepository(db).get_by_id(phase_id)

    def get_all_phases(self, db: Session) -> list[Phase]:
        return PhaseRepository(db).get_all()

    def create_phase(self, db: Session, phase: PhaseRequest) -> Phase:
        return PhaseRepository(db).create(phase)

    def update_phase(self, db: Session, phase_id: int, phase: PhaseRequest) -> Phase | None:
        return PhaseRepository(db).update(phase_id, phase)

    def delete_phase(self, db: Session, phase_id: int) -> Phase | None:
        return PhaseRepository(db).delete(phase_id)

    def delete_all_phases(self, db: Session) -> list[Phase]:
        return PhaseRepository(db).delete_all()

