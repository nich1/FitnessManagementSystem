from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.Cycles.CarbCycle.carb_cycle_service import CarbCycleService
from src.domain.Cycles.CarbCycle.schemas import CarbCycle, CarbCycleRequest

carb_cycle_router = APIRouter(prefix="/carb-cycles", tags=["Carb Cycles"])


@carb_cycle_router.get("/", response_model=list[CarbCycle])
def get_all_carb_cycles(db: Session = Depends(get_db)):
    return CarbCycleService().get_all_carb_cycles(db)


@carb_cycle_router.get("/{carb_cycle_id}", response_model=CarbCycle)
def get_carb_cycle(carb_cycle_id: int, db: Session = Depends(get_db)):
    carb_cycle = CarbCycleService().get_carb_cycle(db, carb_cycle_id)
    if carb_cycle is None:
        raise HTTPException(status_code=404, detail="Carb Cycle not found")
    return carb_cycle


@carb_cycle_router.post("/", response_model=CarbCycle)
def create_carb_cycle(request: CarbCycleRequest, db: Session = Depends(get_db)):
    return CarbCycleService().create_carb_cycle(
        db, request.name, request.description, request.days
    )


@carb_cycle_router.put("/{carb_cycle_id}", response_model=CarbCycle)
def update_carb_cycle(
    carb_cycle_id: int, request: CarbCycleRequest, db: Session = Depends(get_db)
):
    updated = CarbCycleService().update_carb_cycle(
        db, carb_cycle_id, request.name, request.description, request.days
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Carb Cycle not found")
    return updated


@carb_cycle_router.delete("/{carb_cycle_id}", response_model=CarbCycle)
def delete_carb_cycle(carb_cycle_id: int, db: Session = Depends(get_db)):
    deleted = CarbCycleService().delete_carb_cycle(db, carb_cycle_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Carb Cycle not found")
    return deleted


@carb_cycle_router.delete("/", status_code=204)
def delete_all_carb_cycles(db: Session = Depends(get_db)):
    CarbCycleService().delete_all_carb_cycles(db)
    return Response(status_code=204)

