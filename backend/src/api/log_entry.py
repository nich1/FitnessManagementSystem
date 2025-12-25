from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.LogEntry.log_entry_service import LogEntryService
from src.domain.LogEntry.schemas import LogEntry
from src.api.schemas import LogEntryRequest

log_entry_router = APIRouter(prefix="/log-entries", tags=["Log Entries"])


@log_entry_router.get("/", response_model=list[LogEntry])
def get_all_log_entries(db: Session = Depends(get_db)):
    return LogEntryService().get_all_log_entries(db)


@log_entry_router.get("/date/{date}", response_model=LogEntry | None)
def get_log_entry_by_date(date: str, db: Session = Depends(get_db)):
    """Get log entry by date (YYYY-MM-DD format)"""
    return LogEntryService().get_log_entry_by_date(db, date)


@log_entry_router.get("/{log_entry_id}", response_model=LogEntry)
def get_log_entry(log_entry_id: int, db: Session = Depends(get_db)):
    log_entry = LogEntryService().get_log_entry(db, log_entry_id)
    if log_entry is None:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return log_entry


@log_entry_router.post("/", response_model=LogEntry)
def create_log_entry(log_entry: LogEntryRequest, db: Session = Depends(get_db)):
    return LogEntryService().create_log_entry(db, log_entry)


@log_entry_router.put("/{log_entry_id}", response_model=LogEntry)
def update_log_entry(log_entry_id: int, log_entry: LogEntryRequest, db: Session = Depends(get_db)):
    updated = LogEntryService().update_log_entry(db, log_entry_id, log_entry)
    if updated is None:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return updated


@log_entry_router.delete("/{log_entry_id}", response_model=LogEntry)
def delete_log_entry(log_entry_id: int, db: Session = Depends(get_db)):
    deleted = LogEntryService().delete_log_entry(db, log_entry_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return deleted


@log_entry_router.delete("/")
def delete_all_log_entries(db: Session = Depends(get_db)):
    LogEntryService().delete_all_log_entries(db)
    return Response(status_code=204)

