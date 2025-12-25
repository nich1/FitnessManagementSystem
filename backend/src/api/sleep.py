from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.Sleep.sleep_service import SleepService
from src.domain.Sleep.schemas import Sleep
from src.api.schemas import SleepRequest

sleep_router = APIRouter(prefix="/sleep", tags=["Sleep"])


@sleep_router.get("/", response_model=list[Sleep])
def get_all_sleep(db: Session = Depends(get_db)):
    return SleepService().get_all_sleep(db)


@sleep_router.get("/{sleep_id}", response_model=Sleep)
def get_sleep(sleep_id: int, db: Session = Depends(get_db)):
    sleep = SleepService().get_sleep(db, sleep_id)
    if sleep is None:
        raise HTTPException(status_code=404, detail="Sleep record not found")
    return sleep


@sleep_router.post("/", response_model=Sleep)
def create_sleep(sleep: SleepRequest, db: Session = Depends(get_db)):
    return SleepService().create_sleep(db, sleep)


@sleep_router.put("/{sleep_id}", response_model=Sleep)
def update_sleep(sleep_id: int, sleep: SleepRequest, db: Session = Depends(get_db)):
    updated = SleepService().update_sleep(db, sleep_id, sleep)
    if updated is None:
        raise HTTPException(status_code=404, detail="Sleep record not found")
    return updated


@sleep_router.delete("/{sleep_id}", response_model=Sleep)
def delete_sleep(sleep_id: int, db: Session = Depends(get_db)):
    deleted = SleepService().delete_sleep(db, sleep_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Sleep record not found")
    return deleted


@sleep_router.delete("/")
def delete_all_sleep(db: Session = Depends(get_db)):
    SleepService().delete_all_sleep(db)
    return Response(status_code=204)

