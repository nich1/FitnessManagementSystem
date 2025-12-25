from pydantic import BaseModel
from src.domain.Food.schemas import Food

class MealFood(BaseModel):
    food: Food
    servings: float

class Meal(BaseModel):
    id: int
    name: str
    foods: list[MealFood]
