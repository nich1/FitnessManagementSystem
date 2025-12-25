from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.Compound.compound_service import CompoundService
from src.domain.Compound.schemas import Compound
from src.api.schemas import CompoundRequest

compound_router = APIRouter(prefix="/compounds", tags=["Compounds"])


@compound_router.get("/", response_model=list[Compound])
def get_all_compounds(db: Session = Depends(get_db)):
    return CompoundService().get_all_compounds(db)


@compound_router.get("/{compound_id}", response_model=Compound)
def get_compound(compound_id: int, db: Session = Depends(get_db)):
    compound = CompoundService().get_compound(db, compound_id)
    if compound is None:
        raise HTTPException(status_code=404, detail="Compound not found")
    return compound


@compound_router.post("/", response_model=Compound)
def create_compound(compound: CompoundRequest, db: Session = Depends(get_db)):
    return CompoundService().create_compound(db, compound.name, compound.unit)


@compound_router.put("/{compound_id}", response_model=Compound)
def update_compound(compound_id: int, compound: CompoundRequest, db: Session = Depends(get_db)):
    updated = CompoundService().update_compound(db, compound_id, compound.name, compound.unit)
    if updated is None:
        raise HTTPException(status_code=404, detail="Compound not found")
    return updated


@compound_router.delete("/{compound_id}", response_model=Compound)
def delete_compound(compound_id: int, db: Session = Depends(get_db)):
    deleted = CompoundService().delete_compound(db, compound_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Compound not found")
    return deleted


@compound_router.delete("/", status_code=204)
def delete_all_compounds(db: Session = Depends(get_db)):
    CompoundService().delete_all_compounds(db)
    return Response(status_code=204)

