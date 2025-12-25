from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from src.database import Base


class LogEntryFoodModel(Base):
    """Junction table for log entry-food relationship with servings"""
    __tablename__ = "log_entry_foods"

    id = Column(Integer, primary_key=True, index=True)
    log_entry_id = Column(Integer, ForeignKey('log_entries.id'), nullable=False)
    food_id = Column(Integer, ForeignKey('foods.id'), nullable=False)
    servings = Column(Float, nullable=False, default=1.0)

    food = relationship("FoodModel")


class LogEntrySupplementModel(Base):
    """Junction table for log entry-supplement relationship with servings"""
    __tablename__ = "log_entry_supplements"

    id = Column(Integer, primary_key=True, index=True)
    log_entry_id = Column(Integer, ForeignKey('log_entries.id'), nullable=False)
    supplement_id = Column(Integer, ForeignKey('supplements.id'), nullable=False)
    servings = Column(Float, nullable=False, default=1.0)

    supplement = relationship("SupplementModel")


class LogEntryActivityModel(Base):
    """Junction table for log entry-activity relationship"""
    __tablename__ = "log_entry_activities"

    id = Column(Integer, primary_key=True, index=True)
    log_entry_id = Column(Integer, ForeignKey('log_entries.id'), nullable=False)
    activity_id = Column(Integer, ForeignKey('activities.id'), nullable=False)

    activity = relationship("ActivityModel")


class LogEntryModel(Base):
    __tablename__ = "log_entries"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False)
    phase_id = Column(Integer, ForeignKey('phases.id'), nullable=True)
    morning_weight = Column(Float, nullable=True)
    sleep_id = Column(Integer, ForeignKey('sleep.id'), nullable=True)
    hydration_ids = Column(JSON, nullable=True)
    cardio_ids = Column(JSON, nullable=True)  
    stress_id = Column(Integer, ForeignKey('stress.id'), nullable=True)
    num_standard_drinks = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)
    # Carb cycle tracking
    carb_cycle_day_id = Column(Integer, ForeignKey('carb_cycle_days.id'), nullable=True)

    # Direct relationship to foods eaten that day
    log_entry_foods = relationship("LogEntryFoodModel", cascade="all, delete-orphan")
    # Direct relationship to supplements taken that day
    log_entry_supplements = relationship("LogEntrySupplementModel", cascade="all, delete-orphan")
    # Direct relationship to activities performed that day
    log_entry_activities = relationship("LogEntryActivityModel", cascade="all, delete-orphan")
