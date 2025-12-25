from sqlalchemy.orm import Session
from src.api.schemas import MealRequest
from src.domain.Meal.models import MealModel, MealFoodModel
from src.domain.Meal.schemas import Meal, MealFood
from src.domain.Food.models import FoodModel
from src.domain.Food.schemas import Food, Protein, Carbs, Fat, AminoAcid


class MealRepository:
    def __init__(self, db: Session):
        self.db = db

    def _food_model_to_schema(self, model: FoodModel) -> Food:
        """Convert FoodModel to Food schema"""
        amino_acids = None
        if model.protein_amino_acids:
            amino_acids = [AminoAcid(aa) for aa in model.protein_amino_acids]
        
        return Food(
            id=model.id,
            name=model.name,
            serving_name=model.serving_name,
            serving_size=model.serving_size,
            calories=model.calories,
            protein=Protein(
                grams=model.protein_grams,
                complete_amino_acid_profile=model.protein_complete_amino_acid_profile,
                amino_acids=amino_acids
            ),
            carbs=Carbs(
                grams=model.carbs_grams,
                fiber=model.carbs_fiber,
                sugar=model.carbs_sugar,
                added_sugars=model.carbs_added_sugars
            ),
            fat=Fat(
                grams=model.fat_grams,
                saturated=model.fat_saturated,
                monounsaturated=model.fat_monounsaturated,
                polyunsaturated=model.fat_polyunsaturated,
                trans=model.fat_trans
            )
        )

    def _model_to_schema(self, model: MealModel) -> Meal:
        meal_foods = []
        for mf in model.meal_foods:
            meal_foods.append(MealFood(
                food=self._food_model_to_schema(mf.food),
                servings=mf.servings
            ))
        
        return Meal(
            id=model.id,
            name=model.name,
            foods=meal_foods
        )

    def get_by_id(self, meal_id: int) -> Meal | None:
        model = self.db.query(MealModel).filter(MealModel.id == meal_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Meal]:
        models = self.db.query(MealModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, meal: MealRequest) -> Meal:
        model = MealModel(
            name=meal.name
        )
        self.db.add(model)
        self.db.flush()
        
        # Add meal foods
        for food_req in meal.foods:
            meal_food = MealFoodModel(
                meal_id=model.id,
                food_id=food_req.food_id,
                servings=food_req.servings
            )
            self.db.add(meal_food)
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, meal_id: int, meal: MealRequest) -> Meal | None:
        model = self.db.query(MealModel).filter(MealModel.id == meal_id).first()
        if model is None:
            return None
        
        model.name = meal.name
        
        # Delete existing meal foods and recreate
        for mf in model.meal_foods:
            self.db.delete(mf)
        
        for food_req in meal.foods:
            meal_food = MealFoodModel(
                meal_id=model.id,
                food_id=food_req.food_id,
                servings=food_req.servings
            )
            self.db.add(meal_food)
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, meal_id: int) -> Meal | None:
        model = self.db.query(MealModel).filter(MealModel.id == meal_id).first()
        if model is None:
            return None
        meal = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return meal

    def delete_all(self) -> list[Meal]:
        models = self.db.query(MealModel).all()
        meals = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return meals
