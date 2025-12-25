from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.Cycles.SupplementCycle.supplement_cycle_service import SupplementCycleService
from src.domain.Cycles.SupplementCycle.schemas import SupplementCycle, SupplementCycleRequest

supplement_cycle_router = APIRouter(prefix="/supplement-cycles", tags=["Supplement Cycles"])


@supplement_cycle_router.get("/", response_model=list[SupplementCycle])
def get_all_supplement_cycles(db: Session = Depends(get_db)):
    return SupplementCycleService().get_all_supplement_cycles(db)


@supplement_cycle_router.get("/{supplement_cycle_id}", response_model=SupplementCycle)
def get_supplement_cycle(supplement_cycle_id: int, db: Session = Depends(get_db)):
    supplement_cycle = SupplementCycleService().get_supplement_cycle(db, supplement_cycle_id)
    if supplement_cycle is None:
        raise HTTPException(status_code=404, detail="Supplement Cycle not found")
    return supplement_cycle


@supplement_cycle_router.post("/", response_model=SupplementCycle)
def create_supplement_cycle(request: SupplementCycleRequest, db: Session = Depends(get_db)):
    return SupplementCycleService().create_supplement_cycle(
        db, request.name, request.description, request.days
    )


@supplement_cycle_router.put("/{supplement_cycle_id}", response_model=SupplementCycle)
def update_supplement_cycle(
    supplement_cycle_id: int, request: SupplementCycleRequest, db: Session = Depends(get_db)
):
    updated = SupplementCycleService().update_supplement_cycle(
        db, supplement_cycle_id, request.name, request.description, request.days
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Supplement Cycle not found")
    return updated


@supplement_cycle_router.delete("/{supplement_cycle_id}", response_model=SupplementCycle)
def delete_supplement_cycle(supplement_cycle_id: int, db: Session = Depends(get_db)):
    deleted = SupplementCycleService().delete_supplement_cycle(db, supplement_cycle_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Supplement Cycle not found")
    return deleted


@supplement_cycle_router.delete("/", status_code=204)
def delete_all_supplement_cycles(db: Session = Depends(get_db)):
    SupplementCycleService().delete_all_supplement_cycles(db)
    return Response(status_code=204)

