from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.Hydration.hydration_service import CupService
from src.domain.Hydration.schemas import Cup
from src.api.schemas import CupRequest

cup_router = APIRouter(prefix="/cups", tags=["Cups"])


@cup_router.get("/", response_model=list[Cup])
def get_all_cups(db: Session = Depends(get_db)):
    return CupService().get_all_cups(db)


@cup_router.get("/{cup_id}", response_model=Cup)
def get_cup(cup_id: int, db: Session = Depends(get_db)):
    cup = CupService().get_cup(db, cup_id)
    if cup is None:
        raise HTTPException(status_code=404, detail="Cup not found")
    return cup


@cup_router.post("/", response_model=Cup)
def create_cup(cup: CupRequest, db: Session = Depends(get_db)):
    return CupService().create_cup(db, cup.name, cup.amount, cup.unit)


@cup_router.put("/{cup_id}", response_model=Cup)
def update_cup(cup_id: int, cup: CupRequest, db: Session = Depends(get_db)):
    updated = CupService().update_cup(db, cup_id, cup.name, cup.amount, cup.unit)
    if updated is None:
        raise HTTPException(status_code=404, detail="Cup not found")
    return updated


@cup_router.delete("/{cup_id}", response_model=Cup)
def delete_cup(cup_id: int, db: Session = Depends(get_db)):
    deleted = CupService().delete_cup(db, cup_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Cup not found")
    return deleted


@cup_router.delete("/", status_code=204)
def delete_all_cups(db: Session = Depends(get_db)):
    CupService().delete_all_cups(db)
    return Response(status_code=204)

