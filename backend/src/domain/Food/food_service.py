from sqlalchemy.orm import Session
from src.domain.Food.schemas import Food
from src.domain.Food.repository import FoodRepository
from src.api.schemas import FoodRequest


class FoodService:
    def __init__(self, db: Session):
        self.repository = FoodRepository(db)

    def get_food(self, food_id: int) -> Food | None:
        return self.repository.get_by_id(food_id)

    def get_all_foods(self) -> list[Food]:
        return self.repository.get_all()

    def create_food(self, food: FoodRequest) -> Food:
        return self.repository.create(food)

    def update_food(self, food_id: int, food: FoodRequest) -> Food | None:
        return self.repository.update(food_id, food)

    def delete_food(self, food_id: int) -> Food | None:
        return self.repository.delete(food_id)

    def delete_all_foods(self) -> bool:
        deleted = self.repository.delete_all()
        if deleted is None:
            return False
        return True
