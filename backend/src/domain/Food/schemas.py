from pydantic import BaseModel
from enum import Enum

class AminoAcid(str, Enum):
    ARGININE = "arginine"
    HISTIDINE = "histidine"
    ISOLEUCINE = "isoleucine"
    LEUCINE = "leucine"
    LYSINE = "lysine"
    METHIONINE = "methionine"
    PHENYLALANINE = "phenylalanine"
    THREONINE = "threonine"

class FatType(str, Enum):
    SATURATED = "saturated"
    MONOUNSATURATED = "monounsaturated"
    POLYUNSATURATED = "polyunsaturated"


class Protein(BaseModel):
    grams: int
    complete_amino_acid_profile: bool
    amino_acids: list[AminoAcid] | None = None

class Fat(BaseModel):
    grams: int
    fat_type: FatType

class Carbs(BaseModel):
    grams: int
    fiber: int | None = None
    sugar: int | None = None    
    added_sugars: int | None = None


class Food(BaseModel):
    id: int 
    name: str
    calories: int
    grams: int
    protein: Protein
    carbs: Carbs
    fat: Fat