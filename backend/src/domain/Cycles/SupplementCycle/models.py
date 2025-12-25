from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base


class SupplementCycleModel(Base):
    __tablename__ = "supplement_cycles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    days = relationship(
        "SupplementCycleDayModel",
        back_populates="supplement_cycle",
        cascade="all, delete-orphan",
        order_by="SupplementCycleDayModel.position"
    )


class SupplementCycleDayModel(Base):
    __tablename__ = "supplement_cycle_days"

    id = Column(Integer, primary_key=True, index=True)
    supplement_cycle_id = Column(Integer, ForeignKey("supplement_cycles.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False)

    supplement_cycle = relationship("SupplementCycleModel", back_populates="days")
    items = relationship(
        "SupplementCycleDayItemModel",
        back_populates="day",
        cascade="all, delete-orphan"
    )


class SupplementCycleDayItemModel(Base):
    __tablename__ = "supplement_cycle_day_items"

    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("supplement_cycle_days.id", ondelete="CASCADE"), nullable=False)
    supplement_id = Column(Integer, ForeignKey("supplements.id"), nullable=True)
    compound_id = Column(Integer, ForeignKey("compounds.id"), nullable=True)
    amount = Column(Float, nullable=False)

    day = relationship("SupplementCycleDayModel", back_populates="items")

