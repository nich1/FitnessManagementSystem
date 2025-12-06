from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from src.database import Base


class FoodModel(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    calories = Column(Integer, nullable=False)
    grams = Column(Integer, nullable=False)
    
    # Protein fields
    protein_grams = Column(Integer, nullable=False)
    protein_complete_amino_acid_profile = Column(Boolean, nullable=False)
    protein_amino_acids = Column(JSON, nullable=True)  # Store as JSON array
    
    # Carbs fields
    carbs_grams = Column(Integer, nullable=False)
    carbs_fiber = Column(Integer, nullable=True)
    carbs_sugar = Column(Integer, nullable=True)
    carbs_added_sugars = Column(Integer, nullable=True)
    
    # Fat fields
    fat_grams = Column(Integer, nullable=False)
    fat_type = Column(String, nullable=False)

