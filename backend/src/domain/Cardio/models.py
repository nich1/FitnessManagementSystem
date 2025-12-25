from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from src.database import Base


class CardioModel(Base):
    __tablename__ = "cardio"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    time = Column(DateTime, nullable=False)
    exercise_type = Column(String, nullable=False)  # discriminator
    exercise_data = Column(JSON, nullable=False)  # stores type-specific fields

