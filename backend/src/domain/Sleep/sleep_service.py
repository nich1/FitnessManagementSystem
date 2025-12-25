from sqlalchemy.orm import Session
from src.domain.Sleep.schemas import Sleep
from src.domain.Sleep.repository import SleepRepository
from src.api.schemas import SleepRequest


class SleepService:
    def get_sleep(self, db: Session, sleep_id: int) -> Sleep | None:
        return SleepRepository(db).get_by_id(sleep_id)

    def get_all_sleep(self, db: Session) -> list[Sleep]:
        return SleepRepository(db).get_all()

    def create_sleep(self, db: Session, sleep: SleepRequest) -> Sleep:
        return SleepRepository(db).create(sleep)

    def update_sleep(self, db: Session, sleep_id: int, sleep: SleepRequest) -> Sleep | None:
        return SleepRepository(db).update(sleep_id, sleep)

    def delete_sleep(self, db: Session, sleep_id: int) -> Sleep | None:
        return SleepRepository(db).delete(sleep_id)

    def delete_all_sleep(self, db: Session) -> list[Sleep]:
        return SleepRepository(db).delete_all()

