from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base


class MealFoodModel(Base):
    """Junction table for meal-food relationship with servings"""
    __tablename__ = "meal_foods"

    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey('meals.id'), nullable=False)
    food_id = Column(Integer, ForeignKey('foods.id'), nullable=False)
    servings = Column(Float, nullable=False, default=1.0)

    food = relationship("FoodModel")


class MealModel(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    # One-to-many with junction table
    meal_foods = relationship("MealFoodModel", cascade="all, delete-orphan")
