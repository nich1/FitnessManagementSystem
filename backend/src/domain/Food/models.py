from sqlalchemy import Column, Integer, String, Boolean, Float, JSON
from src.database import Base


class FoodModel(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    serving_name = Column(String, nullable=False)
    serving_size = Column(Float, nullable=False)
    calories = Column(Float, nullable=False)
    
    # Protein fields
    protein_grams = Column(Float, nullable=False)
    protein_complete_amino_acid_profile = Column(Boolean, nullable=False)
    protein_amino_acids = Column(JSON, nullable=True)  # Store as JSON array
    
    # Carbs fields
    carbs_grams = Column(Float, nullable=False)
    carbs_fiber = Column(Float, nullable=True)
    carbs_sugar = Column(Float, nullable=True)
    carbs_added_sugars = Column(Float, nullable=True)
    
    # Fat fields
    fat_grams = Column(Float, nullable=False)
    fat_saturated = Column(Float, nullable=True)
    fat_monounsaturated = Column(Float, nullable=True)
    fat_polyunsaturated = Column(Float, nullable=True)
    fat_trans = Column(Float, nullable=True)
    fat_cholesterol = Column(Float, nullable=True)  # in mg
