from pydantic import BaseModel
from datetime import datetime, date
from enum import Enum
from typing import Any


class MetricType(str, Enum):
    # Body metrics
    WEIGHT = "weight"
    
    # Nutrition metrics (from foods)
    CALORIES = "calories"
    PROTEIN = "protein"
    COMPLETE_PROTEIN = "complete_protein"  # Only from foods with complete amino acid profile
    CARBS = "carbs"
    FAT = "fat"
    FIBER = "fiber"
    SUGAR = "sugar"
    
    # Activity metrics
    WORKOUT_COUNT = "workout_count"
    TOTAL_SETS = "total_sets"
    TOTAL_REPS = "total_reps"
    TOTAL_VOLUME = "total_volume"  # weight * reps
    
    # Training-specific metrics (require filter)
    EXERCISE_WEIGHT = "exercise_weight"  # Max/avg weight for an exercise
    EXERCISE_REPS = "exercise_reps"      # Total reps for an exercise
    EXERCISE_SETS = "exercise_sets"      # Total sets for an exercise
    EXERCISE_VOLUME = "exercise_volume"  # Total volume for an exercise
    
    # Cardio-specific metrics (optional filter by type)
    CARDIO_DURATION = "cardio_duration"    # Total minutes
    CARDIO_DISTANCE = "cardio_distance"    # Total distance (running, cycling, swimming)
    CARDIO_SPEED = "cardio_speed"          # Avg speed (incline walking, running)
    CARDIO_INCLINE = "cardio_incline"      # Avg incline (incline walking)
    
    # Supplement-specific metrics (require filter)
    SUPPLEMENT_SERVINGS = "supplement_servings"  # Servings of a specific supplement
    COMPOUND_AMOUNT = "compound_amount"          # Total amount of a specific compound
    
    # Cardio metrics
    CARDIO_MINUTES = "cardio_minutes"
    CARDIO_SESSIONS = "cardio_sessions"
    
    # Sleep metrics
    SLEEP_DURATION = "sleep_duration"
    SLEEP_QUALITY = "sleep_quality"
    
    # Hydration
    HYDRATION_OZ = "hydration_oz"
    HYDRATION_ML = "hydration_ml"
    
    # Supplements
    SUPPLEMENT_COUNT = "supplement_count"
    
    # Stress
    STRESS_LEVEL = "stress_level"
    
    # Alcohol
    ALCOHOL_DRINKS = "alcohol_drinks"


class DateRangeType(str, Enum):
    CUSTOM = "custom"
    MESOCYCLE = "mesocycle"
    ALL_TIME = "all_time"
    LAST_7_DAYS = "last_7_days"
    LAST_30_DAYS = "last_30_days"
    LAST_90_DAYS = "last_90_days"
    THIS_WEEK = "this_week"
    THIS_MONTH = "this_month"
    THIS_YEAR = "this_year"


class AggregationType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ChartType(str, Enum):
    LINE = "line"
    BAR = "bar"
    AREA = "area"


class TrainingFilterType(str, Enum):
    NONE = "none"
    EXERCISE = "exercise"
    MOVEMENT_PATTERN = "movement_pattern"
    WORKOUT = "workout"
    MESOCYCLE = "mesocycle"


class CardioFilterType(str, Enum):
    NONE = "none"  # All cardio
    INCLINE_WALKING = "incline_walking"
    SPRINTS = "sprints"
    WALKING = "walking"
    RUNNING = "running"
    CYCLING = "cycling"
    SWIMMING = "swimming"
    OTHER = "other"


class StatsQueryRequest(BaseModel):
    """Request for fetching statistics data"""
    metrics: list[MetricType]
    date_range_type: DateRangeType
    start_date: date | None = None  # Required for CUSTOM
    end_date: date | None = None    # Required for CUSTOM
    mesocycle_id: int | None = None # Required for MESOCYCLE date range
    aggregation: AggregationType = AggregationType.DAILY
    
    # Training filters - for exercise-specific metrics
    training_filter_type: TrainingFilterType = TrainingFilterType.NONE
    exercise_id: int | None = None
    movement_pattern_id: int | None = None
    workout_id: int | None = None
    training_mesocycle_id: int | None = None  # Filter by mesocycle for training
    
    # Cardio filter - for cardio-specific metrics
    cardio_filter_type: CardioFilterType = CardioFilterType.NONE
    
    # Supplement/compound filters - for supplement comparison
    supplement_ids: list[int] | None = None  # Filter by specific supplements
    compound_ids: list[int] | None = None    # Filter by specific compounds
    

class DataPoint(BaseModel):
    """A single data point in a time series"""
    date: str  # ISO date string
    value: float | None


class MetricData(BaseModel):
    """Data for a single metric"""
    metric: MetricType
    label: str
    unit: str
    data: list[DataPoint]
    average: float | None = None
    min_value: float | None = None
    max_value: float | None = None
    total: float | None = None


class StatsQueryResponse(BaseModel):
    """Response containing statistics data"""
    metrics: list[MetricData]
    start_date: str
    end_date: str
    aggregation: AggregationType


# Configuration schemas
class StatsConfigurationConfig(BaseModel):
    """The actual configuration content"""
    metrics: list[MetricType]
    date_range_type: DateRangeType
    start_date: str | None = None
    end_date: str | None = None
    mesocycle_id: int | None = None
    aggregation: AggregationType = AggregationType.DAILY
    chart_type: ChartType = ChartType.LINE


class StatsConfigurationRequest(BaseModel):
    name: str
    description: str | None = None
    config: StatsConfigurationConfig


class StatsConfiguration(BaseModel):
    id: int
    name: str
    description: str | None = None
    config: StatsConfigurationConfig
    created_at: datetime
    updated_at: datetime

