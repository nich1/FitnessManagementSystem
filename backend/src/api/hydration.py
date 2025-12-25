from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.Hydration.hydration_service import HydrationService
from src.domain.Hydration.schemas import Hydration
from src.api.schemas import HydrationRequest

hydration_router = APIRouter(prefix="/hydration", tags=["Hydration"])


@hydration_router.get("/", response_model=list[Hydration])
def get_all_hydration(db: Session = Depends(get_db)):
    return HydrationService().get_all_hydration(db)


@hydration_router.get("/{hydration_id}", response_model=Hydration)
def get_hydration(hydration_id: int, db: Session = Depends(get_db)):
    hydration = HydrationService().get_hydration(db, hydration_id)
    if hydration is None:
        raise HTTPException(status_code=404, detail="Hydration record not found")
    return hydration


@hydration_router.post("/", response_model=Hydration)
def create_hydration(hydration: HydrationRequest, db: Session = Depends(get_db)):
    return HydrationService().create_hydration(
        db, hydration.timestamp, hydration.cup_id, hydration.servings
    )


@hydration_router.put("/{hydration_id}", response_model=Hydration)
def update_hydration(hydration_id: int, hydration: HydrationRequest, db: Session = Depends(get_db)):
    updated = HydrationService().update_hydration(
        db, hydration_id, hydration.timestamp, hydration.cup_id, hydration.servings
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Hydration record not found")
    return updated


@hydration_router.delete("/{hydration_id}", response_model=Hydration)
def delete_hydration(hydration_id: int, db: Session = Depends(get_db)):
    deleted = HydrationService().delete_hydration(db, hydration_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Hydration record not found")
    return deleted


@hydration_router.delete("/", status_code=204)
def delete_all_hydration(db: Session = Depends(get_db)):
    HydrationService().delete_all_hydration(db)
    return Response(status_code=204)
