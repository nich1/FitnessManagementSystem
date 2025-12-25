from sqlalchemy.orm import Session
from src.domain.LogEntry.schemas import LogEntry
from src.domain.LogEntry.repository import LogEntryRepository
from src.api.schemas import LogEntryRequest


class LogEntryService:
    def get_log_entry(self, db: Session, log_entry_id: int) -> LogEntry | None:
        return LogEntryRepository(db).get_by_id(log_entry_id)

    def get_all_log_entries(self, db: Session) -> list[LogEntry]:
        return LogEntryRepository(db).get_all()

    def get_log_entry_by_date(self, db: Session, date_str: str) -> LogEntry | None:
        return LogEntryRepository(db).get_by_date(date_str)

    def create_log_entry(self, db: Session, log_entry: LogEntryRequest) -> LogEntry:
        return LogEntryRepository(db).create(log_entry)

    def update_log_entry(self, db: Session, log_entry_id: int, log_entry: LogEntryRequest) -> LogEntry | None:
        return LogEntryRepository(db).update(log_entry_id, log_entry)

    def delete_log_entry(self, db: Session, log_entry_id: int) -> LogEntry | None:
        return LogEntryRepository(db).delete(log_entry_id)

    def delete_all_log_entries(self, db: Session) -> list[LogEntry]:
        return LogEntryRepository(db).delete_all()

