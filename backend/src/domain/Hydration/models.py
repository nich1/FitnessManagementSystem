from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base


class CupModel(Base):
    """A reusable container/vessel for tracking hydration"""
    __tablename__ = "cups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    unit = Column(String, nullable=False)  # HydrationUnit enum value


class HydrationModel(Base):
    __tablename__ = "hydration"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False)
    cup_id = Column(Integer, ForeignKey("cups.id"), nullable=False)
    servings = Column(Float, nullable=False, default=1.0)  # How many times the cup was filled

    cup = relationship("CupModel", lazy="joined")
