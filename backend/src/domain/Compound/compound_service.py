from sqlalchemy.orm import Session
from src.domain.Compound.repository import CompoundRepository
from src.domain.Compound.schemas import Compound, CompoundUnit


class CompoundService:
    def get_compound(self, db: Session, compound_id: int) -> Compound | None:
        return CompoundRepository(db).get_by_id(compound_id)

    def get_all_compounds(self, db: Session) -> list[Compound]:
        return CompoundRepository(db).get_all()

    def create_compound(self, db: Session, name: str, unit: CompoundUnit) -> Compound:
        return CompoundRepository(db).create(name, unit)

    def update_compound(self, db: Session, compound_id: int, name: str, unit: CompoundUnit) -> Compound | None:
        return CompoundRepository(db).update(compound_id, name, unit)

    def delete_compound(self, db: Session, compound_id: int) -> Compound | None:
        return CompoundRepository(db).delete(compound_id)

    def delete_all_compounds(self, db: Session) -> list[Compound]:
        return CompoundRepository(db).delete_all()

