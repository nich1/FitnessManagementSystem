from pydantic import BaseModel
from src.domain.Food.schemas import Protein, Carbs, Fat


class FoodRequest(BaseModel):
    name: str
    calories: int
    grams: int
    protein: Protein
    carbs: Carbs
    fat: Fat
