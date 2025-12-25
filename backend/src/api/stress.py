from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.Stress.stress_service import StressService
from src.domain.Stress.schemas import Stress
from src.api.schemas import StressRequest

stress_router = APIRouter(prefix="/stress", tags=["Stress"])


@stress_router.get("/", response_model=list[Stress])
def get_all_stress(db: Session = Depends(get_db)):
    return StressService().get_all_stress(db)


@stress_router.get("/{stress_id}", response_model=Stress)
def get_stress(stress_id: int, db: Session = Depends(get_db)):
    stress = StressService().get_stress(db, stress_id)
    if stress is None:
        raise HTTPException(status_code=404, detail="Stress record not found")
    return stress


@stress_router.post("/", response_model=Stress)
def create_stress(stress: StressRequest, db: Session = Depends(get_db)):
    return StressService().create_stress(db, stress)


@stress_router.put("/{stress_id}", response_model=Stress)
def update_stress(stress_id: int, stress: StressRequest, db: Session = Depends(get_db)):
    updated = StressService().update_stress(db, stress_id, stress)
    if updated is None:
        raise HTTPException(status_code=404, detail="Stress record not found")
    return updated


@stress_router.delete("/{stress_id}", response_model=Stress)
def delete_stress(stress_id: int, db: Session = Depends(get_db)):
    deleted = StressService().delete_stress(db, stress_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Stress record not found")
    return deleted


@stress_router.delete("/")
def delete_all_stress(db: Session = Depends(get_db)):
    StressService().delete_all_stress(db)
    return Response(status_code=204)

