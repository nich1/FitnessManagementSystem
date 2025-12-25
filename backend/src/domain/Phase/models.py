from sqlalchemy import Column, Integer, String
from src.database import Base


class PhaseModel(Base):
    __tablename__ = "phases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., "Bulk", "Cut", "Maintenance"

