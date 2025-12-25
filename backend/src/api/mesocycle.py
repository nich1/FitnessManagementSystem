from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.Cycles.Mesocycle.mesocycle_service import MesocycleService
from src.domain.Cycles.Mesocycle.schemas import Mesocycle, MesocycleRequest

mesocycle_router = APIRouter(prefix="/mesocycles", tags=["Mesocycles"])


@mesocycle_router.get("/", response_model=list[Mesocycle])
def get_all_mesocycles(db: Session = Depends(get_db)):
    return MesocycleService().get_all_mesocycles(db)


@mesocycle_router.get("/{mesocycle_id}", response_model=Mesocycle)
def get_mesocycle(mesocycle_id: int, db: Session = Depends(get_db)):
    mesocycle = MesocycleService().get_mesocycle(db, mesocycle_id)
    if mesocycle is None:
        raise HTTPException(status_code=404, detail="Mesocycle not found")
    return mesocycle


@mesocycle_router.post("/", response_model=Mesocycle)
def create_mesocycle(request: MesocycleRequest, db: Session = Depends(get_db)):
    return MesocycleService().create_mesocycle(
        db, request.name, request.description, request.start_date, request.end_date, request.microcycles
    )


@mesocycle_router.put("/{mesocycle_id}", response_model=Mesocycle)
def update_mesocycle(
    mesocycle_id: int, request: MesocycleRequest, db: Session = Depends(get_db)
):
    updated = MesocycleService().update_mesocycle(
        db, mesocycle_id, request.name, request.description, request.start_date, request.end_date, request.microcycles
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Mesocycle not found")
    return updated


@mesocycle_router.delete("/{mesocycle_id}", response_model=Mesocycle)
def delete_mesocycle(mesocycle_id: int, db: Session = Depends(get_db)):
    deleted = MesocycleService().delete_mesocycle(db, mesocycle_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Mesocycle not found")
    return deleted


@mesocycle_router.delete("/", status_code=204)
def delete_all_mesocycles(db: Session = Depends(get_db)):
    MesocycleService().delete_all_mesocycles(db)
    return Response(status_code=204)

