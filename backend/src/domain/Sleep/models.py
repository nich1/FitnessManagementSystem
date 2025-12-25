from sqlalchemy import Column, Integer, String, Date, JSON
from src.database import Base


class SleepModel(Base):
    __tablename__ = "sleep"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    duration = Column(Integer, nullable=False)  # minutes
    quality = Column(Integer, nullable=False)  # 1-10 scale
    notes = Column(String, nullable=True)
    naps = Column(JSON, nullable=False, default=[])  # list of nap dicts

