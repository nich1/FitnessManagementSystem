from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.MovementPattern.movement_pattern_service import MovementPatternService
from src.domain.MovementPattern.schemas import MovementPattern, MovementPatternWithExercises
from pydantic import BaseModel


movement_pattern_router = APIRouter(prefix="/movement-patterns", tags=["Movement Patterns"])


class MovementPatternRequest(BaseModel):
    name: str
    description: str | None = None


@movement_pattern_router.get("/", response_model=list[MovementPatternWithExercises])
def get_all_movement_patterns(db: Session = Depends(get_db)):
    return MovementPatternService().get_all_movement_patterns(db)


@movement_pattern_router.get("/{pattern_id}", response_model=MovementPattern)
def get_movement_pattern(pattern_id: int, db: Session = Depends(get_db)):
    pattern = MovementPatternService().get_movement_pattern(db, pattern_id)
    if pattern is None:
        raise HTTPException(status_code=404, detail="Movement pattern not found")
    return pattern


@movement_pattern_router.post("/", response_model=MovementPattern)
def create_movement_pattern(pattern: MovementPatternRequest, db: Session = Depends(get_db)):
    return MovementPatternService().create_movement_pattern(db, pattern.name, pattern.description)


@movement_pattern_router.put("/{pattern_id}", response_model=MovementPattern)
def update_movement_pattern(pattern_id: int, pattern: MovementPatternRequest, db: Session = Depends(get_db)):
    updated = MovementPatternService().update_movement_pattern(db, pattern_id, pattern.name, pattern.description)
    if updated is None:
        raise HTTPException(status_code=404, detail="Movement pattern not found")
    return updated


@movement_pattern_router.delete("/{pattern_id}", response_model=MovementPattern)
def delete_movement_pattern(pattern_id: int, db: Session = Depends(get_db)):
    deleted = MovementPatternService().delete_movement_pattern(db, pattern_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Movement pattern not found")
    return deleted


@movement_pattern_router.delete("/", status_code=204)
def delete_all_movement_patterns(db: Session = Depends(get_db)):
    MovementPatternService().delete_all_movement_patterns(db)
    return Response(status_code=204)

