from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from src.database import Base


class SupplementCompoundModel(Base):
    """Junction table for supplement-compound many-to-many with amount"""
    __tablename__ = "supplement_compounds"

    id = Column(Integer, primary_key=True, index=True)
    supplement_id = Column(Integer, ForeignKey("supplements.id", ondelete="CASCADE"), nullable=False)
    compound_id = Column(Integer, ForeignKey("compounds.id"), nullable=False)
    amount = Column(Float, nullable=False)  # amount per serving

    compound = relationship("CompoundModel")


class SupplementModel(Base):
    __tablename__ = "supplements"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String, nullable=False)
    name = Column(String, nullable=False)
    serving_name = Column(String, nullable=False)  # e.g., "2 softgels"

    supplement_compounds = relationship(
        "SupplementCompoundModel",
        cascade="all, delete-orphan",
        lazy="joined"
    )
