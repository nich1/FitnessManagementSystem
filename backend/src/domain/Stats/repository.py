from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from .models import StatsConfigurationModel
from .schemas import (
    StatsConfiguration, StatsConfigurationRequest, StatsConfigurationConfig,
    StatsQueryRequest, StatsQueryResponse, MetricData, DataPoint,
    MetricType, DateRangeType, AggregationType, TrainingFilterType, CardioFilterType
)
from src.domain.LogEntry.models import LogEntryModel, LogEntryFoodModel
from src.domain.Food.models import FoodModel
from src.domain.Activity.models import ActivityModel, ActivityExerciseModel, ActivitySetModel
from src.domain.Cardio.models import CardioModel
from src.domain.Sleep.models import SleepModel
from src.domain.Hydration.models import HydrationModel, CupModel
from src.domain.Stress.models import StressModel
from src.domain.Cycles.Mesocycle.models import MesocycleModel
from src.domain.Exercise.models import ExerciseModel
from src.domain.MovementPattern.models import MovementPatternModel
from src.domain.Workout.models import WorkoutModel
from src.domain.Supplement.models import SupplementModel, SupplementCompoundModel
from src.domain.Compound.models import CompoundModel


METRIC_INFO = {
    MetricType.WEIGHT: {"label": "Weight", "unit": "lbs"},
    MetricType.CALORIES: {"label": "Calories", "unit": "kcal"},
    MetricType.PROTEIN: {"label": "Protein", "unit": "g"},
    MetricType.CARBS: {"label": "Carbs", "unit": "g"},
    MetricType.FAT: {"label": "Fat", "unit": "g"},
    MetricType.FIBER: {"label": "Fiber", "unit": "g"},
    MetricType.SUGAR: {"label": "Sugar", "unit": "g"},
    MetricType.WORKOUT_COUNT: {"label": "Workouts", "unit": "sessions"},
    MetricType.TOTAL_SETS: {"label": "Total Sets", "unit": "sets"},
    MetricType.TOTAL_REPS: {"label": "Total Reps", "unit": "reps"},
    MetricType.TOTAL_VOLUME: {"label": "Total Volume", "unit": "lbs"},
    MetricType.COMPLETE_PROTEIN: {"label": "Complete Protein", "unit": "g"},
    MetricType.EXERCISE_WEIGHT: {"label": "Weight", "unit": "lbs"},
    MetricType.EXERCISE_REPS: {"label": "Reps", "unit": "reps"},
    MetricType.EXERCISE_SETS: {"label": "Sets", "unit": "sets"},
    MetricType.EXERCISE_VOLUME: {"label": "Volume", "unit": "lbs"},
    MetricType.CARDIO_DURATION: {"label": "Duration", "unit": "min"},
    MetricType.CARDIO_DISTANCE: {"label": "Distance", "unit": "mi"},
    MetricType.CARDIO_SPEED: {"label": "Speed", "unit": "mph"},
    MetricType.CARDIO_INCLINE: {"label": "Incline", "unit": "%"},
    MetricType.SUPPLEMENT_SERVINGS: {"label": "Servings", "unit": "servings"},
    MetricType.COMPOUND_AMOUNT: {"label": "Amount", "unit": ""},  # Unit depends on compound
    MetricType.CARDIO_MINUTES: {"label": "Cardio", "unit": "min"},
    MetricType.CARDIO_SESSIONS: {"label": "Cardio Sessions", "unit": "sessions"},
    MetricType.SLEEP_DURATION: {"label": "Sleep", "unit": "hours"},
    MetricType.SLEEP_QUALITY: {"label": "Sleep Quality", "unit": "/10"},
    MetricType.HYDRATION_OZ: {"label": "Hydration", "unit": "oz"},
    MetricType.HYDRATION_ML: {"label": "Hydration", "unit": "ml"},
    MetricType.SUPPLEMENT_COUNT: {"label": "Supplements", "unit": "count"},
    MetricType.STRESS_LEVEL: {"label": "Stress Level", "unit": "/5"},
    MetricType.ALCOHOL_DRINKS: {"label": "Alcohol", "unit": "drinks"},
}


class StatsRepository:
    def __init__(self, db: Session):
        self.db = db

    def _get_date_range(self, request: StatsQueryRequest) -> tuple[date, date]:
        """Calculate actual date range based on request"""
        today = date.today()
        
        if request.date_range_type == DateRangeType.CUSTOM:
            return request.start_date, request.end_date
        elif request.date_range_type == DateRangeType.ALL_TIME:
            # Get earliest log entry
            earliest = self.db.query(func.min(LogEntryModel.timestamp)).scalar()
            if earliest:
                return earliest.date(), today
            return today - timedelta(days=30), today
        elif request.date_range_type == DateRangeType.LAST_7_DAYS:
            return today - timedelta(days=7), today
        elif request.date_range_type == DateRangeType.LAST_30_DAYS:
            return today - timedelta(days=30), today
        elif request.date_range_type == DateRangeType.LAST_90_DAYS:
            return today - timedelta(days=90), today
        elif request.date_range_type == DateRangeType.THIS_WEEK:
            start = today - timedelta(days=today.weekday())
            return start, today
        elif request.date_range_type == DateRangeType.THIS_MONTH:
            start = today.replace(day=1)
            return start, today
        elif request.date_range_type == DateRangeType.THIS_YEAR:
            start = today.replace(month=1, day=1)
            return start, today
        elif request.date_range_type == DateRangeType.MESOCYCLE:
            if request.mesocycle_id:
                meso = self.db.query(MesocycleModel).filter(
                    MesocycleModel.id == request.mesocycle_id
                ).first()
                if meso and meso.start_date and meso.end_date:
                    return meso.start_date, meso.end_date
            return today - timedelta(days=30), today
        
        return today - timedelta(days=30), today

    def _get_log_entries_in_range(self, start: date, end: date):
        """Get all log entries within date range"""
        return self.db.query(LogEntryModel).filter(
            func.date(LogEntryModel.timestamp) >= start,
            func.date(LogEntryModel.timestamp) <= end
        ).all()

    def _aggregate_by_period(self, data: dict[date, float], start: date, end: date, 
                             aggregation: AggregationType) -> list[DataPoint]:
        """Aggregate data points by the specified period"""
        result = []
        current = start
        
        while current <= end:
            if aggregation == AggregationType.DAILY:
                period_end = current
                period_key = current.isoformat()
            elif aggregation == AggregationType.WEEKLY:
                period_end = min(current + timedelta(days=6), end)
                period_key = current.isoformat()
            elif aggregation == AggregationType.MONTHLY:
                # Go to end of month
                if current.month == 12:
                    next_month = current.replace(year=current.year + 1, month=1, day=1)
                else:
                    next_month = current.replace(month=current.month + 1, day=1)
                period_end = min(next_month - timedelta(days=1), end)
                period_key = current.strftime("%Y-%m")
            
            # Sum values for this period
            period_values = []
            check_date = current
            while check_date <= period_end:
                if check_date in data and data[check_date] is not None:
                    period_values.append(data[check_date])
                check_date += timedelta(days=1)
            
            if period_values:
                # Use average for rates/levels, sum for counts
                result.append(DataPoint(date=period_key, value=sum(period_values) / len(period_values)))
            else:
                result.append(DataPoint(date=period_key, value=None))
            
            # Move to next period
            if aggregation == AggregationType.DAILY:
                current += timedelta(days=1)
            elif aggregation == AggregationType.WEEKLY:
                current += timedelta(days=7)
            elif aggregation == AggregationType.MONTHLY:
                if current.month == 12:
                    current = current.replace(year=current.year + 1, month=1, day=1)
                else:
                    current = current.replace(month=current.month + 1, day=1)
        
        return result

    def _get_metric_data(self, metric: MetricType, entries: list, 
                         start: date, end: date, aggregation: AggregationType,
                         request: StatsQueryRequest | None = None) -> MetricData:
        """Get data for a specific metric"""
        data_by_date: dict[date, float] = {}
        
        for entry in entries:
            entry_date = entry.timestamp.date() if isinstance(entry.timestamp, datetime) else entry.timestamp
            
            if metric == MetricType.WEIGHT:
                if entry.morning_weight:
                    data_by_date[entry_date] = entry.morning_weight
                    
            elif metric == MetricType.ALCOHOL_DRINKS:
                if entry.num_standard_drinks:
                    data_by_date[entry_date] = entry.num_standard_drinks
                    
            elif metric in [MetricType.CALORIES, MetricType.PROTEIN, MetricType.CARBS, 
                          MetricType.FAT, MetricType.FIBER, MetricType.SUGAR]:
                # Sum nutrition from foods
                total = 0
                for food_entry in entry.log_entry_foods:
                    food = food_entry.food
                    servings = food_entry.servings
                    if metric == MetricType.CALORIES:
                        total += (food.calories or 0) * servings
                    elif metric == MetricType.PROTEIN:
                        total += (food.protein_grams or 0) * servings
                    elif metric == MetricType.CARBS:
                        total += (food.carbs_grams or 0) * servings
                    elif metric == MetricType.FAT:
                        total += (food.fat_grams or 0) * servings
                    elif metric == MetricType.FIBER:
                        total += (food.carbs_fiber or 0) * servings
                    elif metric == MetricType.SUGAR:
                        total += (food.carbs_sugar or 0) * servings
                if total > 0:
                    data_by_date[entry_date] = total
            
            elif metric == MetricType.COMPLETE_PROTEIN:
                # Sum protein only from foods with complete amino acid profile
                total = 0
                for food_entry in entry.log_entry_foods:
                    food = food_entry.food
                    if food.protein_complete_amino_acid_profile:
                        total += (food.protein_grams or 0) * food_entry.servings
                if total > 0:
                    data_by_date[entry_date] = total
            
            elif metric in [MetricType.EXERCISE_WEIGHT, MetricType.EXERCISE_REPS, 
                          MetricType.EXERCISE_SETS, MetricType.EXERCISE_VOLUME]:
                # Exercise-specific metrics with filters
                if request:
                    values = []
                    for activity_link in entry.log_entry_activities:
                        activity = activity_link.activity
                        if not activity:
                            continue
                        
                        # Apply workout filter
                        if request.training_filter_type == TrainingFilterType.WORKOUT:
                            if request.workout_id and activity.workout_id != request.workout_id:
                                continue
                        
                        for ex in activity.exercises:
                            exercise = ex.exercise
                            
                            # Apply exercise filter
                            if request.training_filter_type == TrainingFilterType.EXERCISE:
                                if request.exercise_id and exercise.id != request.exercise_id:
                                    continue
                            
                            # Apply movement pattern filter
                            if request.training_filter_type == TrainingFilterType.MOVEMENT_PATTERN:
                                if request.movement_pattern_id and exercise.movement_pattern_id != request.movement_pattern_id:
                                    continue
                            
                            for s in ex.sets:
                                if metric == MetricType.EXERCISE_SETS:
                                    values.append(1)
                                elif metric == MetricType.EXERCISE_REPS:
                                    values.append(s.reps or 0)
                                elif metric == MetricType.EXERCISE_WEIGHT:
                                    if s.weight:
                                        values.append(s.weight)
                                elif metric == MetricType.EXERCISE_VOLUME:
                                    values.append((s.reps or 0) * (s.weight or 0))
                    
                    if values:
                        if metric == MetricType.EXERCISE_WEIGHT:
                            # Use max weight for the day
                            data_by_date[entry_date] = max(values)
                        else:
                            # Sum for reps, sets, volume
                            data_by_date[entry_date] = sum(values)
                    
            elif metric == MetricType.WORKOUT_COUNT:
                count = len(entry.log_entry_activities)
                if count > 0:
                    data_by_date[entry_date] = count
                    
            elif metric in [MetricType.TOTAL_SETS, MetricType.TOTAL_REPS, MetricType.TOTAL_VOLUME]:
                total = 0
                for activity_link in entry.log_entry_activities:
                    activity = activity_link.activity
                    if activity:
                        for ex in activity.exercises:
                            for s in ex.sets:
                                if metric == MetricType.TOTAL_SETS:
                                    total += 1
                                elif metric == MetricType.TOTAL_REPS:
                                    total += s.reps or 0
                                elif metric == MetricType.TOTAL_VOLUME:
                                    total += (s.reps or 0) * (s.weight or 0)
                if total > 0:
                    data_by_date[entry_date] = total
                    
            elif metric in [MetricType.CARDIO_MINUTES, MetricType.CARDIO_SESSIONS]:
                if entry.cardio_ids:
                    if metric == MetricType.CARDIO_SESSIONS:
                        data_by_date[entry_date] = len(entry.cardio_ids)
                    else:
                        total_minutes = 0
                        for cardio_id in entry.cardio_ids:
                            cardio = self.db.query(CardioModel).filter(CardioModel.id == cardio_id).first()
                            if cardio and cardio.exercise_data:
                                total_minutes += cardio.exercise_data.get('duration_minutes', 0)
                        if total_minutes > 0:
                            data_by_date[entry_date] = total_minutes
            
            elif metric in [MetricType.CARDIO_DURATION, MetricType.CARDIO_DISTANCE, 
                          MetricType.CARDIO_SPEED, MetricType.CARDIO_INCLINE]:
                # Cardio-specific metrics with optional type filter
                if entry.cardio_ids and request:
                    values = []
                    for cardio_id in entry.cardio_ids:
                        cardio = self.db.query(CardioModel).filter(CardioModel.id == cardio_id).first()
                        if not cardio:
                            continue
                        
                        # Apply cardio type filter
                        if request.cardio_filter_type != CardioFilterType.NONE:
                            if cardio.exercise_type != request.cardio_filter_type.value:
                                continue
                        
                        data = cardio.exercise_data or {}
                        
                        if metric == MetricType.CARDIO_DURATION:
                            if data.get('duration_minutes'):
                                values.append(data['duration_minutes'])
                        elif metric == MetricType.CARDIO_DISTANCE:
                            if data.get('distance'):
                                values.append(data['distance'])
                        elif metric == MetricType.CARDIO_SPEED:
                            if data.get('speed'):
                                values.append(data['speed'])
                        elif metric == MetricType.CARDIO_INCLINE:
                            if data.get('incline'):
                                values.append(data['incline'])
                    
                    if values:
                        # Sum for duration/distance, average for speed/incline
                        if metric in [MetricType.CARDIO_DURATION, MetricType.CARDIO_DISTANCE]:
                            data_by_date[entry_date] = sum(values)
                        else:
                            data_by_date[entry_date] = sum(values) / len(values)
                            
            elif metric == MetricType.SLEEP_DURATION:
                if entry.sleep_id:
                    sleep = self.db.query(SleepModel).filter(SleepModel.id == entry.sleep_id).first()
                    if sleep:
                        data_by_date[entry_date] = sleep.duration
                        
            elif metric == MetricType.SLEEP_QUALITY:
                if entry.sleep_id:
                    sleep = self.db.query(SleepModel).filter(SleepModel.id == entry.sleep_id).first()
                    if sleep:
                        data_by_date[entry_date] = sleep.quality
                        
            elif metric in [MetricType.HYDRATION_OZ, MetricType.HYDRATION_ML]:
                if entry.hydration_ids:
                    total = 0
                    for hyd_id in entry.hydration_ids:
                        hyd = self.db.query(HydrationModel).filter(HydrationModel.id == hyd_id).first()
                        if hyd and hyd.cup:
                            amount = hyd.cup.amount * hyd.servings
                            if hyd.cup.unit == 'oz':
                                if metric == MetricType.HYDRATION_OZ:
                                    total += amount
                                else:
                                    total += amount * 29.5735  # Convert to ml
                            else:  # ml
                                if metric == MetricType.HYDRATION_ML:
                                    total += amount
                                else:
                                    total += amount / 29.5735  # Convert to oz
                    if total > 0:
                        data_by_date[entry_date] = total
                        
            elif metric == MetricType.SUPPLEMENT_COUNT:
                count = len(entry.log_entry_supplements)
                if count > 0:
                    data_by_date[entry_date] = count
            
            elif metric == MetricType.SUPPLEMENT_SERVINGS:
                # Track servings for specific supplements
                if request and request.supplement_ids:
                    total_servings = 0
                    for supp_entry in entry.log_entry_supplements:
                        if supp_entry.supplement_id in request.supplement_ids:
                            total_servings += supp_entry.servings
                    if total_servings > 0:
                        data_by_date[entry_date] = total_servings
            
            elif metric == MetricType.COMPOUND_AMOUNT:
                # Track total amount of specific compounds
                if request and request.compound_ids:
                    total_amount = 0
                    for supp_entry in entry.log_entry_supplements:
                        supplement = supp_entry.supplement
                        if supplement:
                            # Get compound amounts from supplement
                            for sc in supplement.supplement_compounds:
                                if sc.compound_id in request.compound_ids:
                                    total_amount += sc.amount * supp_entry.servings
                    if total_amount > 0:
                        data_by_date[entry_date] = total_amount
                    
            elif metric == MetricType.STRESS_LEVEL:
                if entry.stress_id:
                    stress = self.db.query(StressModel).filter(StressModel.id == entry.stress_id).first()
                    if stress:
                        # Convert stress level to numeric
                        level_map = {'very_low': 1, 'low': 2, 'moderate': 3, 'high': 4, 'very_high': 5}
                        data_by_date[entry_date] = level_map.get(stress.level, 3)

        # Aggregate data
        data_points = self._aggregate_by_period(data_by_date, start, end, aggregation)
        
        # Calculate stats
        values = [dp.value for dp in data_points if dp.value is not None]
        
        info = METRIC_INFO.get(metric, {"label": str(metric), "unit": ""})
        
        return MetricData(
            metric=metric,
            label=info["label"],
            unit=info["unit"],
            data=data_points,
            average=sum(values) / len(values) if values else None,
            min_value=min(values) if values else None,
            max_value=max(values) if values else None,
            total=sum(values) if values else None
        )

    def query_stats(self, request: StatsQueryRequest) -> StatsQueryResponse:
        """Execute a stats query and return the data"""
        start_date, end_date = self._get_date_range(request)
        entries = self._get_log_entries_in_range(start_date, end_date)
        
        metrics_data = []
        for metric in request.metrics:
            metric_data = self._get_metric_data(metric, entries, start_date, end_date, request.aggregation, request)
            metrics_data.append(metric_data)
        
        return StatsQueryResponse(
            metrics=metrics_data,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            aggregation=request.aggregation
        )


class StatsConfigurationRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: StatsConfigurationModel) -> StatsConfiguration:
        return StatsConfiguration(
            id=model.id,
            name=model.name,
            description=model.description,
            config=StatsConfigurationConfig(**model.config),
            created_at=model.created_at,
            updated_at=model.updated_at
        )

    def get_all(self) -> list[StatsConfiguration]:
        models = self.db.query(StatsConfigurationModel).order_by(
            StatsConfigurationModel.name
        ).all()
        return [self._model_to_schema(m) for m in models]

    def get_by_id(self, config_id: int) -> StatsConfiguration | None:
        model = self.db.query(StatsConfigurationModel).filter(
            StatsConfigurationModel.id == config_id
        ).first()
        return self._model_to_schema(model) if model else None

    def create(self, request: StatsConfigurationRequest) -> StatsConfiguration:
        model = StatsConfigurationModel(
            name=request.name,
            description=request.description,
            config=request.config.model_dump()
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, config_id: int, request: StatsConfigurationRequest) -> StatsConfiguration | None:
        model = self.db.query(StatsConfigurationModel).filter(
            StatsConfigurationModel.id == config_id
        ).first()
        if not model:
            return None
        
        model.name = request.name
        model.description = request.description
        model.config = request.config.model_dump()
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, config_id: int) -> bool:
        model = self.db.query(StatsConfigurationModel).filter(
            StatsConfigurationModel.id == config_id
        ).first()
        if not model:
            return False
        self.db.delete(model)
        self.db.commit()
        return True

