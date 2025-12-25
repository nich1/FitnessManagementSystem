from sqlalchemy.orm import Session
from src.domain.Supplement.repository import SupplementRepository
from src.domain.Supplement.schemas import Supplement


class SupplementService:
    def get_supplement(self, db: Session, supplement_id: int) -> Supplement | None:
        return SupplementRepository(db).get_by_id(supplement_id)

    def get_all_supplements(self, db: Session) -> list[Supplement]:
        return SupplementRepository(db).get_all()

    def create_supplement(self, db: Session, brand: str, name: str, serving_name: str, compounds: list[dict]) -> Supplement:
        return SupplementRepository(db).create(brand, name, serving_name, compounds)

    def update_supplement(self, db: Session, supplement_id: int, brand: str, name: str, serving_name: str, compounds: list[dict]) -> Supplement | None:
        return SupplementRepository(db).update(supplement_id, brand, name, serving_name, compounds)

    def delete_supplement(self, db: Session, supplement_id: int) -> Supplement | None:
        return SupplementRepository(db).delete(supplement_id)

    def delete_all_supplements(self, db: Session) -> list[Supplement]:
        return SupplementRepository(db).delete_all()
