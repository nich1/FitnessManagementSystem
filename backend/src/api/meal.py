from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.domain.Meal.schemas import Meal
from src.domain.Meal.meal_service import MealService
from src.api.schemas import MealRequest
from src.database import get_db

meal_router = APIRouter(prefix="/meals", tags=["Meals"])


@meal_router.get("/", response_model=list[Meal])
async def get_all_meals(db: Session = Depends(get_db)) -> list[Meal]:
    return MealService(db).get_all_meals()


@meal_router.get("/{id}", response_model=Meal)
async def get_meal(id: int, db: Session = Depends(get_db)) -> Meal:
    meal = MealService(db).get_meal(id)
    if meal is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    return meal


@meal_router.post("/", response_model=Meal)
async def create_meal(meal: MealRequest, db: Session = Depends(get_db)) -> Meal:
    return MealService(db).create_meal(meal)


@meal_router.put("/{id}", response_model=Meal)
async def update_meal(id: int, meal: MealRequest, db: Session = Depends(get_db)) -> Meal:
    updated = MealService(db).update_meal(id, meal)
    if updated is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    return updated


@meal_router.delete("/{id}", response_model=Meal)
async def delete_meal(id: int, db: Session = Depends(get_db)) -> Meal:
    deleted = MealService(db).delete_meal(id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    return deleted

@meal_router.delete("/", status_code=200)
async def delete_all_meals(db: Session = Depends(get_db)):
    deleted = MealService(db).delete_all_meals()
    if deleted is None:
        raise HTTPException(status_code=404, detail="Meals not found")
    return deleted
