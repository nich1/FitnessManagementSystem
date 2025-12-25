from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base


class WorkoutItemModel(Base):
    """An item in a workout template - either an exercise or a movement pattern"""
    __tablename__ = "workout_items"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey('workouts.id'), nullable=False)
    position = Column(Integer, nullable=False)  # Order in the workout
    
    # Either exercise_id or movement_pattern_id should be set, not both
    exercise_id = Column(Integer, ForeignKey('exercises.id'), nullable=True)
    movement_pattern_id = Column(Integer, ForeignKey('movement_patterns.id'), nullable=True)
    
    workout = relationship("WorkoutModel", back_populates="items")
    exercise = relationship("ExerciseModel")
    movement_pattern = relationship("MovementPatternModel")


class WorkoutModel(Base):
    """A workout template - an ordered collection of exercises and movement patterns"""
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    items = relationship("WorkoutItemModel", back_populates="workout", cascade="all, delete-orphan", order_by="WorkoutItemModel.position")
