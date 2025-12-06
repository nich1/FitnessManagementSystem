from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.domain.Food.schemas import Food
from src.domain.Food.food_service import FoodService
from src.api.schemas import FoodRequest
from src.database import get_db

food_router = APIRouter(prefix="/foods", tags=["Foods"])


@food_router.get("/", response_model=list[Food])
async def get_all_foods(db: Session = Depends(get_db)) -> list[Food]:
    return FoodService(db).get_all_foods()


@food_router.get("/{id}", response_model=Food)
async def get_food(id: int, db: Session = Depends(get_db)) -> Food:
    food = FoodService(db).get_food(id)
    if food is None:
        raise HTTPException(status_code=404, detail="Food not found")
    return food


@food_router.post("/", response_model=Food)
async def create_food(food: FoodRequest, db: Session = Depends(get_db)) -> Food:
    return FoodService(db).create_food(food)


@food_router.put("/{id}", response_model=Food)
async def update_food(id: int, food: FoodRequest, db: Session = Depends(get_db)) -> Food:
    updated = FoodService(db).update_food(id, food)
    if updated is None:
        raise HTTPException(status_code=404, detail="Food not found")
    return updated


@food_router.delete("/{id}", response_model=Food)
async def delete_food(id: int, db: Session = Depends(get_db)) -> Food:
    deleted = FoodService(db).delete_food(id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Food not found")
    return deleted

@food_router.delete("/", status_code=200)
async def delete_all_foods(db: Session = Depends(get_db)):
    deleted = FoodService(db).delete_all_foods()
    if deleted is None:
        raise HTTPException(status_code=404, detail="Foods not found")
    return deleted
