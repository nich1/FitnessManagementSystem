from sqlalchemy.orm import Session
from src.domain.Food.models import FoodModel
from src.domain.Food.schemas import Food, Protein, Carbs, Fat, AminoAcid
from src.api.schemas import FoodRequest


class FoodRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: FoodModel) -> Food:
        """Convert SQLAlchemy model to Pydantic schema"""
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
                trans=model.fat_trans,
                cholesterol=model.fat_cholesterol
            )
        )

    def get_by_id(self, food_id: int) -> Food | None:
        model = self.db.query(FoodModel).filter(FoodModel.id == food_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Food]:
        models = self.db.query(FoodModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, food: FoodRequest) -> Food:
        amino_acids_json = None
        if food.protein.amino_acids:
            amino_acids_json = [aa.value for aa in food.protein.amino_acids]
        
        model = FoodModel(
            name=food.name,
            serving_name=food.serving_name,
            serving_size=food.serving_size,
            calories=food.calories,
            protein_grams=food.protein.grams,
            protein_complete_amino_acid_profile=food.protein.complete_amino_acid_profile,
            protein_amino_acids=amino_acids_json,
            carbs_grams=food.carbs.grams,
            carbs_fiber=food.carbs.fiber,
            carbs_sugar=food.carbs.sugar,
            carbs_added_sugars=food.carbs.added_sugars,
            fat_grams=food.fat.grams,
            fat_saturated=food.fat.saturated,
            fat_monounsaturated=food.fat.monounsaturated,
            fat_polyunsaturated=food.fat.polyunsaturated,
            fat_trans=food.fat.trans,
            fat_cholesterol=food.fat.cholesterol
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, food_id: int, food: FoodRequest) -> Food | None:
        model = self.db.query(FoodModel).filter(FoodModel.id == food_id).first()
        if model is None:
            return None
        
        amino_acids_json = None
        if food.protein.amino_acids:
            amino_acids_json = [aa.value for aa in food.protein.amino_acids]
        
        model.name = food.name
        model.serving_name = food.serving_name
        model.serving_size = food.serving_size
        model.calories = food.calories
        model.protein_grams = food.protein.grams
        model.protein_complete_amino_acid_profile = food.protein.complete_amino_acid_profile
        model.protein_amino_acids = amino_acids_json
        model.carbs_grams = food.carbs.grams
        model.carbs_fiber = food.carbs.fiber
        model.carbs_sugar = food.carbs.sugar
        model.carbs_added_sugars = food.carbs.added_sugars
        model.fat_grams = food.fat.grams
        model.fat_saturated = food.fat.saturated
        model.fat_monounsaturated = food.fat.monounsaturated
        model.fat_polyunsaturated = food.fat.polyunsaturated
        model.fat_trans = food.fat.trans
        model.fat_cholesterol = food.fat.cholesterol
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, food_id: int) -> Food | None:
        model = self.db.query(FoodModel).filter(FoodModel.id == food_id).first()
        if model is None:
            return None
        food = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return food

    def delete_all(self) -> list[Food]:
        models = self.db.query(FoodModel).all()
        foods = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return foods
