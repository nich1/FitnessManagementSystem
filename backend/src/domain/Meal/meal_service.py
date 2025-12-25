from sqlalchemy.orm import Session
from src.domain.Meal.schemas import Meal
from src.domain.Meal.repository import MealRepository
from src.api.schemas import MealRequest


class MealService:
    def __init__(self, db: Session):
        self.repository = MealRepository(db)

    def get_meal(self, meal_id: int) -> Meal | None:
        return self.repository.get_by_id(meal_id)

    def get_all_meals(self) -> list[Meal]:
        return self.repository.get_all()

    def create_meal(self, meal: MealRequest) -> Meal:
        return self.repository.create(meal)

    def update_meal(self, meal_id: int, meal: MealRequest) -> Meal | None:
        return self.repository.update(meal_id, meal)

    def delete_meal(self, meal_id: int) -> Meal | None:
        return self.repository.delete(meal_id)

    def delete_all_meals(self) -> bool:
        self.repository.delete_all()
        return True
