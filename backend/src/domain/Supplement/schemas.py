from pydantic import BaseModel
from src.domain.Compound.schemas import Compound


class SupplementCompound(BaseModel):
    """Amount of a compound in a supplement product"""
    compound: Compound
    amount: float  # amount per serving


class Supplement(BaseModel):
    """A branded supplement product (e.g., Nordic Naturals Ultimate Omega)"""
    id: int
    brand: str
    name: str
    serving_name: str  # e.g., "2 softgels", "1 capsule"
    compounds: list[SupplementCompound]
