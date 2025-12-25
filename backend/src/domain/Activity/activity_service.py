from sqlalchemy.orm import Session
from src.domain.Activity.schemas import Activity
from src.domain.Activity.repository import ActivityRepository


class ActivityService:
    def get_activity(self, db: Session, activity_id: int) -> Activity | None:
        return ActivityRepository(db).get_by_id(activity_id)

    def get_all_activities(self, db: Session) -> list[Activity]:
        return ActivityRepository(db).get_all()

    def create_activity(self, db: Session, time, workout_id: int | None, notes: str | None, exercises: list[dict]) -> Activity:
        return ActivityRepository(db).create(time, workout_id, notes, exercises)

    def update_activity(self, db: Session, activity_id: int, time, workout_id: int | None, notes: str | None, exercises: list[dict]) -> Activity | None:
        return ActivityRepository(db).update(activity_id, time, workout_id, notes, exercises)

    def delete_activity(self, db: Session, activity_id: int) -> Activity | None:
        return ActivityRepository(db).delete(activity_id)

    def delete_all_activities(self, db: Session) -> list[Activity]:
        return ActivityRepository(db).delete_all()

