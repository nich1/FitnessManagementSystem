from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.Supplement.supplement_service import SupplementService
from src.domain.Supplement.schemas import Supplement
from src.api.schemas import SupplementRequest

supplement_router = APIRouter(prefix="/supplements", tags=["Supplements"])


@supplement_router.get("/", response_model=list[Supplement])
def get_all_supplements(db: Session = Depends(get_db)):
    return SupplementService().get_all_supplements(db)


@supplement_router.get("/{supplement_id}", response_model=Supplement)
def get_supplement(supplement_id: int, db: Session = Depends(get_db)):
    supplement = SupplementService().get_supplement(db, supplement_id)
    if supplement is None:
        raise HTTPException(status_code=404, detail="Supplement not found")
    return supplement


@supplement_router.post("/", response_model=Supplement)
def create_supplement(supplement: SupplementRequest, db: Session = Depends(get_db)):
    compounds = [{"compound_id": c.compound_id, "amount": c.amount} for c in supplement.compounds]
    return SupplementService().create_supplement(
        db, supplement.brand, supplement.name, supplement.serving_name, compounds
    )


@supplement_router.put("/{supplement_id}", response_model=Supplement)
def update_supplement(supplement_id: int, supplement: SupplementRequest, db: Session = Depends(get_db)):
    compounds = [{"compound_id": c.compound_id, "amount": c.amount} for c in supplement.compounds]
    updated = SupplementService().update_supplement(
        db, supplement_id, supplement.brand, supplement.name, supplement.serving_name, compounds
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Supplement not found")
    return updated


@supplement_router.delete("/{supplement_id}", response_model=Supplement)
def delete_supplement(supplement_id: int, db: Session = Depends(get_db)):
    deleted = SupplementService().delete_supplement(db, supplement_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Supplement not found")
    return deleted


@supplement_router.delete("/", status_code=204)
def delete_all_supplements(db: Session = Depends(get_db)):
    SupplementService().delete_all_supplements(db)
    return Response(status_code=204)
