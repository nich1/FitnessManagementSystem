from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.Phase.phase_service import PhaseService
from src.domain.Phase.schemas import Phase
from src.api.schemas import PhaseRequest

phase_router = APIRouter(prefix="/phases", tags=["Phases"])


@phase_router.get("/", response_model=list[Phase])
def get_all_phases(db: Session = Depends(get_db)):
    return PhaseService().get_all_phases(db)


@phase_router.get("/{phase_id}", response_model=Phase)
def get_phase(phase_id: int, db: Session = Depends(get_db)):
    phase = PhaseService().get_phase(db, phase_id)
    if phase is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    return phase


@phase_router.post("/", response_model=Phase)
def create_phase(phase: PhaseRequest, db: Session = Depends(get_db)):
    return PhaseService().create_phase(db, phase)


@phase_router.put("/{phase_id}", response_model=Phase)
def update_phase(phase_id: int, phase: PhaseRequest, db: Session = Depends(get_db)):
    updated = PhaseService().update_phase(db, phase_id, phase)
    if updated is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    return updated


@phase_router.delete("/{phase_id}", response_model=Phase)
def delete_phase(phase_id: int, db: Session = Depends(get_db)):
    deleted = PhaseService().delete_phase(db, phase_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Phase not found")
    return deleted


@phase_router.delete("/")
def delete_all_phases(db: Session = Depends(get_db)):
    PhaseService().delete_all_phases(db)
    return Response(status_code=204)

