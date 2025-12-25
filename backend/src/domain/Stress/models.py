from sqlalchemy import Column, Integer, String, DateTime
from src.database import Base


class StressModel(Base):
    __tablename__ = "stress"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False)
    level = Column(String, nullable=False)  # StressLevel enum value
    notes = Column(String, nullable=True)

