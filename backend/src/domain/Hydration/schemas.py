from pydantic import BaseModel
from datetime import datetime
from enum import Enum


class HydrationUnit(str, Enum):
    ML = "ml"
    OZ = "oz"
    L = "l"


class Cup(BaseModel):
    """A reusable container/vessel for tracking hydration (e.g., 'My Water Bottle' = 750ml)"""
    id: int
    name: str
    amount: float
    unit: HydrationUnit


class Hydration(BaseModel):
    """A hydration entry - references a Cup and tracks how many times it was filled"""
    id: int
    timestamp: datetime
    cup: Cup
    servings: float = 1.0  # How many times the cup was filled/consumed
