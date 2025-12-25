from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "sqlite:///./fitness.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import all models to ensure they're registered with SQLAlchemy
    from src.domain.Food.models import FoodModel
    from src.domain.Meal.models import MealModel, MealFoodModel
    from src.domain.Exercise.models import ExerciseModel
    from src.domain.MovementPattern.models import MovementPatternModel
    from src.domain.Workout.models import WorkoutModel, WorkoutItemModel
    from src.domain.Activity.models import ActivityModel, ActivityExerciseModel, ActivitySetModel
    from src.domain.Cardio.models import CardioModel
    from src.domain.Sleep.models import SleepModel
    from src.domain.Stress.models import StressModel
    from src.domain.Hydration.models import HydrationModel, CupModel
    from src.domain.Supplement.models import SupplementModel, SupplementCompoundModel
    from src.domain.Compound.models import CompoundModel
    from src.domain.Phase.models import PhaseModel
    from src.domain.LogEntry.models import LogEntryModel, LogEntryFoodModel, LogEntrySupplementModel, LogEntryActivityModel
    from src.domain.Cycles.CarbCycle.models import CarbCycleModel, CarbCycleDayModel
    from src.domain.Cycles.SupplementCycle.models import SupplementCycleModel, SupplementCycleDayModel, SupplementCycleDayItemModel
    from src.domain.Cycles.Mesocycle.models import MesocycleModel, MicrocycleModel, MicrocycleDayModel
    from src.domain.ProgressPicture.models import ProgressPictureModel
    from src.domain.Stats.models import StatsConfigurationModel
    
    Base.metadata.create_all(bind=engine)

