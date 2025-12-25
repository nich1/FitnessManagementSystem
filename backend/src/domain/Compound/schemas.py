from pydantic import BaseModel
from enum import Enum


class CompoundUnit(str, Enum):
    MG = "mg"
    MCG = "mcg"
    G = "g"
    IU = "iu"
    ML = "ml"


class Compound(BaseModel):
    """A specific vitamin, mineral, or compound (e.g., EPA, DHA, Vitamin D3, Zinc)"""
    id: int
    name: str
    unit: CompoundUnit

