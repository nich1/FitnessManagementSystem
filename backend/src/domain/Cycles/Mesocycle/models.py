from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base


class MesocycleModel(Base):
    __tablename__ = "mesocycles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    microcycles = relationship(
        "MicrocycleModel",
        back_populates="mesocycle",
        cascade="all, delete-orphan",
        order_by="MicrocycleModel.position"
    )


class MicrocycleModel(Base):
    __tablename__ = "microcycles"

    id = Column(Integer, primary_key=True, index=True)
    mesocycle_id = Column(Integer, ForeignKey("mesocycles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    position = Column(Integer, nullable=False)
    description = Column(String, nullable=True)

    mesocycle = relationship("MesocycleModel", back_populates="microcycles")
    days = relationship(
        "MicrocycleDayModel",
        back_populates="microcycle",
        cascade="all, delete-orphan",
        order_by="MicrocycleDayModel.position"
    )


class MicrocycleDayModel(Base):
    __tablename__ = "microcycle_days"

    id = Column(Integer, primary_key=True, index=True)
    microcycle_id = Column(Integer, ForeignKey("microcycles.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=True)  # nullable for rest days (workout_id = 0 means rest)

    microcycle = relationship("MicrocycleModel", back_populates="days")

