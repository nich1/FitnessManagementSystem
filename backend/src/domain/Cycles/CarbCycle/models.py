from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base


class CarbCycleModel(Base):
    __tablename__ = "carb_cycles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    days = relationship(
        "CarbCycleDayModel",
        back_populates="carb_cycle",
        cascade="all, delete-orphan",
        order_by="CarbCycleDayModel.position"
    )


class CarbCycleDayModel(Base):
    __tablename__ = "carb_cycle_days"

    id = Column(Integer, primary_key=True, index=True)
    carb_cycle_id = Column(Integer, ForeignKey("carb_cycles.id", ondelete="CASCADE"), nullable=False)
    day_type = Column(String, nullable=False)  # CarbCycleDayType enum value
    carbs = Column(Float, nullable=False)
    position = Column(Integer, nullable=False)

    carb_cycle = relationship("CarbCycleModel", back_populates="days")

