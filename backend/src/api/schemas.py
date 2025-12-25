from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Literal, Annotated, Union
from src.domain.Food.schemas import Protein, Carbs, Fat
from src.domain.Exercise.schemas import Unit
from src.domain.Cardio.schemas import CardioExercise
from src.domain.Stress.schemas import StressLevel
from src.domain.Compound.schemas import CompoundUnit
from src.domain.Hydration.schemas import HydrationUnit


class FoodRequest(BaseModel):
    name: str
    serving_name: str
    serving_size: float
    calories: float
    protein: Protein
    carbs: Carbs
    fat: Fat


class MealFoodRequest(BaseModel):
    food_id: int
    servings: float = 1.0


class MealRequest(BaseModel):
    name: str
    foods: list[MealFoodRequest]


class ExerciseRequest(BaseModel):
    name: str


class CardioRequest(BaseModel):
    name: str
    time: datetime
    exercise: CardioExercise


class NapRequest(BaseModel):
    duration: int  # minutes


class SleepRequest(BaseModel):
    date: date
    duration: int  # minutes
    quality: int  # 1-10 scale
    notes: str | None = None
    naps: list[NapRequest] = []


class StressRequest(BaseModel):
    timestamp: datetime
    level: StressLevel
    notes: str | None = None


class ActivitySetRequest(BaseModel):
    reps: int
    weight: float
    unit: Unit | None = None
    rir: int | None = None  # Reps In Reserve
    notes: str | None = None


class ActivityExerciseRequest(BaseModel):
    exercise_id: int
    session_notes: str | None = None
    sets: list[ActivitySetRequest]


class ActivityRequest(BaseModel):
    workout_id: int | None = None  # Optional - can be from a template
    time: datetime
    notes: str | None = None
    exercises: list[ActivityExerciseRequest]


class PhaseRequest(BaseModel):
    name: str  # e.g., "Bulk", "Cut", "Maintenance"


class CupRequest(BaseModel):
    name: str
    amount: float
    unit: HydrationUnit


class HydrationRequest(BaseModel):
    timestamp: datetime
    cup_id: int
    servings: float = 1.0


class CompoundRequest(BaseModel):
    name: str
    unit: CompoundUnit


class SupplementCompoundRequest(BaseModel):
    compound_id: int
    amount: float


class SupplementRequest(BaseModel):
    brand: str
    name: str
    serving_name: str  # e.g., "2 softgels", "1 capsule"
    compounds: list[SupplementCompoundRequest]


# =============================================================================
# Discriminated Union Input Types (for LogEntry inline creation)
# =============================================================================

# --- Phase ---
class PhaseExisting(BaseModel):
    type: Literal["existing"] = "existing"
    id: int


class PhaseNew(BaseModel):
    type: Literal["new"] = "new"
    name: str


PhaseInput = Annotated[Union[PhaseExisting, PhaseNew], Field(discriminator="type")]


# --- Sleep ---
class SleepExisting(BaseModel):
    type: Literal["existing"] = "existing"
    id: int


class SleepNew(BaseModel):
    type: Literal["new"] = "new"
    date: date
    duration: int
    quality: int
    notes: str | None = None
    naps: list[NapRequest] = []


SleepInput = Annotated[Union[SleepExisting, SleepNew], Field(discriminator="type")]


# --- Hydration ---
class HydrationExisting(BaseModel):
    type: Literal["existing"] = "existing"
    id: int


class HydrationNew(BaseModel):
    type: Literal["new"] = "new"
    timestamp: datetime
    cup_id: int
    servings: float = 1.0


HydrationInput = Annotated[Union[HydrationExisting, HydrationNew], Field(discriminator="type")]


# --- LogEntry Food (direct food entries for a day) ---
class LogEntryFoodInput(BaseModel):
    food_id: int
    servings: float = 1.0


# --- Activity ---
class ActivityExisting(BaseModel):
    type: Literal["existing"] = "existing"
    id: int


class ActivityNew(BaseModel):
    type: Literal["new"] = "new"
    workout_id: int | None = None
    time: datetime
    notes: str | None = None
    exercises: list[ActivityExerciseRequest]


ActivityInput = Annotated[Union[ActivityExisting, ActivityNew], Field(discriminator="type")]


# --- Cardio ---
class CardioExisting(BaseModel):
    type: Literal["existing"] = "existing"
    id: int


class CardioNew(BaseModel):
    type: Literal["new"] = "new"
    name: str
    time: datetime
    exercise: CardioExercise


CardioInput = Annotated[Union[CardioExisting, CardioNew], Field(discriminator="type")]


# --- Supplement ---
class SupplementExisting(BaseModel):
    type: Literal["existing"] = "existing"
    id: int
    servings: float = 1.0


class SupplementNew(BaseModel):
    type: Literal["new"] = "new"
    brand: str
    name: str
    serving_name: str
    compounds: list[SupplementCompoundRequest]
    servings: float = 1.0


SupplementInput = Annotated[Union[SupplementExisting, SupplementNew], Field(discriminator="type")]


# --- Stress ---
class StressExisting(BaseModel):
    type: Literal["existing"] = "existing"
    id: int


class StressNew(BaseModel):
    type: Literal["new"] = "new"
    timestamp: datetime
    level: StressLevel
    notes: str | None = None


StressInput = Annotated[Union[StressExisting, StressNew], Field(discriminator="type")]


# =============================================================================
# LogEntry Request (using discriminated unions)
# =============================================================================

class LogEntryRequest(BaseModel):
    timestamp: datetime
    phase: PhaseInput | None = None
    morning_weight: float | None = None
    sleep: SleepInput | None = None
    hydration: list[HydrationInput] | None = None
    foods: list[LogEntryFoodInput] | None = None  # Direct food entries for the day
    activities: list[ActivityInput] | None = None
    cardio: list[CardioInput] | None = None
    supplements: list[SupplementInput] | None = None
    stress: StressInput | None = None
    num_standard_drinks: int | None = None
    notes: str | None = None
    carb_cycle_day_id: int | None = None  # Selected carb cycle day
