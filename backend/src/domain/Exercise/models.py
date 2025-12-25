from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base


class ExerciseModel(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    movement_pattern_id = Column(Integer, ForeignKey('movement_patterns.id'), nullable=True)
    notes = Column(Text, nullable=True)  # Notes displayed in every log entry when added to workouts

    movement_pattern = relationship("MovementPatternModel", back_populates="exercises")
