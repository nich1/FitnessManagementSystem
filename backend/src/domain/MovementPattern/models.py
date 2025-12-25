from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from src.database import Base


class MovementPatternModel(Base):
    """A movement pattern groups related exercises (e.g., 'Push', 'Pull', 'Squat')"""
    __tablename__ = "movement_patterns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)

    # Exercises that belong to this movement pattern
    exercises = relationship("ExerciseModel", back_populates="movement_pattern")

