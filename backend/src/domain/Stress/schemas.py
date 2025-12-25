from pydantic import BaseModel
from enum import Enum
from datetime import datetime

class StressLevel(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"

class Stress(BaseModel):
    id: int
    timestamp: datetime
    level: StressLevel
    notes: str | None = None