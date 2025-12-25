from pydantic import BaseModel
from enum import Enum

class AminoAcid(str, Enum):
    HISTIDINE = "histidine"
    ISOLEUCINE = "isoleucine"
    LEUCINE = "leucine"
    METHIONINE = "methionine"
    PHENYLALANINE = "phenylalanine"
    THREONINE = "threonine"
    TRYPTOPHANE = "tryptophan"
    VALINE = "valine"
    LYSINE = "lysine"
    ARGININE = "arginine"
    ASPARAGINE = "asparagine"
    GLUTAMINE = "glutamine"
    GLYCINE = "glycine"
    PROLINE = "proline"
    SERINE = "serine"
    TYROSINE = "tyrosine"
    ALANINE = "alanine"
    ASPARTATE = "aspartate"
    CYSTEINE = "cysteine"
    GLUTAMATE = "glutamate"

class Protein(BaseModel):
    grams: float
    complete_amino_acid_profile: bool
    amino_acids: list[AminoAcid] | None = None

class Fat(BaseModel):
    grams: float
    saturated: float | None = None
    monounsaturated: float | None = None
    polyunsaturated: float | None = None
    trans: float | None = None
    cholesterol: float | None = None  # in mg

class Carbs(BaseModel):
    grams: float
    fiber: float | None = None
    sugar: float | None = None    
    added_sugars: float | None = None


class Food(BaseModel):
    id: int 
    name: str
    serving_name: str
    serving_size: float
    calories: float
    protein: Protein
    carbs: Carbs
    fat: Fat