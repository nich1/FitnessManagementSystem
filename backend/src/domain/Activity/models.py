from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from src.database import Base


class ActivitySetModel(Base):
    """A single set performed during an activity"""
    __tablename__ = "activity_sets"

    id = Column(Integer, primary_key=True, index=True)
    activity_exercise_id = Column(Integer, ForeignKey('activity_exercises.id'), nullable=False)
    reps = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)
    unit = Column(String, nullable=True)  # "kg" or "lb"
    rir = Column(Integer, nullable=True)  # Reps In Reserve
    notes = Column(String, nullable=True)
    
    activity_exercise = relationship("ActivityExerciseModel", back_populates="sets")


class ActivityExerciseModel(Base):
    """An exercise performed during an activity with session notes"""
    __tablename__ = "activity_exercises"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey('activities.id'), nullable=False)
    exercise_id = Column(Integer, ForeignKey('exercises.id'), nullable=False)
    position = Column(Integer, nullable=False)  # Order in the activity
    session_notes = Column(Text, nullable=True)  # Notes specific to this session
    
    activity = relationship("ActivityModel", back_populates="exercises")
    exercise = relationship("ExerciseModel")
    sets = relationship("ActivitySetModel", back_populates="activity_exercise", cascade="all, delete-orphan")


class ActivityModel(Base):
    """An activity is a workout instance for a specific log entry"""
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey('workouts.id'), nullable=True)  # Optional - can be from a template
    time = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)  # General activity notes
    
    workout = relationship("WorkoutModel")
    exercises = relationship("ActivityExerciseModel", back_populates="activity", cascade="all, delete-orphan", order_by="ActivityExerciseModel.position")

