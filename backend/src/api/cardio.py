from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.domain.Cardio.schemas import Cardio
from src.domain.Cardio.cardio_service import CardioService
from src.api.schemas import CardioRequest
from src.database import get_db

cardio_router = APIRouter(prefix="/cardio", tags=["Cardio"])


@cardio_router.get("/", response_model=list[Cardio])
async def get_all_cardio(db: Session = Depends(get_db)) -> list[Cardio]:
    return CardioService(db).get_all_cardio()


@cardio_router.get("/{id}", response_model=Cardio)
async def get_cardio(id: int, db: Session = Depends(get_db)) -> Cardio:
    cardio = CardioService(db).get_cardio(id)
    if cardio is None:
        raise HTTPException(status_code=404, detail="Cardio not found")
    return cardio


@cardio_router.post("/", response_model=Cardio)
async def create_cardio(cardio: CardioRequest, db: Session = Depends(get_db)) -> Cardio:
    return CardioService(db).create_cardio(cardio)


@cardio_router.put("/{id}", response_model=Cardio)
async def update_cardio(id: int, cardio: CardioRequest, db: Session = Depends(get_db)) -> Cardio:
    updated = CardioService(db).update_cardio(id, cardio)
    if updated is None:
        raise HTTPException(status_code=404, detail="Cardio not found")
    return updated


@cardio_router.delete("/{id}", response_model=Cardio)
async def delete_cardio(id: int, db: Session = Depends(get_db)) -> Cardio:
    deleted = CardioService(db).delete_cardio(id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Cardio not found")
    return deleted


@cardio_router.delete("/", status_code=204)
async def delete_all_cardio(db: Session = Depends(get_db)):
    CardioService(db).delete_all_cardio()

