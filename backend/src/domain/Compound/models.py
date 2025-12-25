from sqlalchemy import Column, Integer, String
from src.database import Base


class CompoundModel(Base):
    __tablename__ = "compounds"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    unit = Column(String, nullable=False)  # CompoundUnit enum value

