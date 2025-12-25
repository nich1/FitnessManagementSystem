from pydantic import BaseModel
from datetime import datetime
from src.domain.Sleep.schemas import Sleep
from src.domain.Stress.schemas import Stress
from src.domain.Meal.schemas import MealFood
from src.domain.Activity.schemas import Activity
from src.domain.Cardio.schemas import Cardio
from src.domain.Supplement.schemas import Supplement
from src.domain.Phase.schemas import Phase
from src.domain.Hydration.schemas import Hydration
from src.domain.Cycles.CarbCycle.schemas import CarbCycle, CarbCycleDay
from src.domain.ProgressPicture.schemas import ProgressPicture


class LogEntrySupplement(BaseModel):
    """Supplement with servings for a log entry"""
    supplement: Supplement
    servings: float


class LogEntryCarbCycle(BaseModel):
    """Carb cycle day selection for a log entry"""
    carb_cycle: CarbCycle
    selected_day: CarbCycleDay


class LogEntry(BaseModel):
    id: int
    timestamp: datetime
    phase: Phase | None = None
    morning_weight: float | None = None
    sleep: Sleep | None = None
    hydration: list[Hydration] | None = None
    foods: list[MealFood] | None = None  # Direct list of foods eaten that day
    activities: list[Activity] | None = None  # Activities (workout instances) for the day
    cardio: list[Cardio] | None = None
    supplements: list[LogEntrySupplement] | None = None
    stress: Stress | None = None
    num_standard_drinks: int | None = None
    notes: str | None = None
    carb_cycle: LogEntryCarbCycle | None = None
    progress_pictures: list[ProgressPicture] | None = None
