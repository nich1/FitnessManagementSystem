from sqlalchemy.orm import Session
from src.domain.LogEntry.models import LogEntryModel, LogEntryFoodModel, LogEntrySupplementModel, LogEntryActivityModel
from src.domain.LogEntry.schemas import LogEntry, LogEntrySupplement, LogEntryCarbCycle
from src.domain.Phase.models import PhaseModel
from src.domain.Phase.schemas import Phase
from src.domain.Sleep.models import SleepModel
from src.domain.Sleep.schemas import Sleep, Nap
from src.domain.Hydration.models import HydrationModel, CupModel
from src.domain.Hydration.schemas import Hydration, Cup, HydrationUnit
from src.domain.Meal.schemas import MealFood
from src.domain.Activity.models import ActivityModel, ActivityExerciseModel, ActivitySetModel
from src.domain.Activity.schemas import Activity, ActivityExercise, ActivitySet, ActivityWorkout
from src.domain.Cardio.models import CardioModel
from src.domain.Cardio.schemas import Cardio
from src.domain.Cardio.repository import CardioRepository
from src.domain.Supplement.models import SupplementModel, SupplementCompoundModel
from src.domain.Supplement.schemas import Supplement, SupplementCompound
from src.domain.Compound.schemas import Compound, CompoundUnit
from src.domain.Stress.models import StressModel
from src.domain.Stress.schemas import Stress, StressLevel
from src.domain.Food.models import FoodModel
from src.domain.Food.repository import FoodRepository
from src.domain.Exercise.schemas import Exercise, Unit
from src.domain.Exercise.models import ExerciseModel
from src.domain.Cycles.CarbCycle.models import CarbCycleDayModel, CarbCycleModel
from src.domain.Cycles.CarbCycle.schemas import CarbCycle, CarbCycleDay, CarbCycleDayType
from src.domain.ProgressPicture.models import ProgressPictureModel
from src.domain.ProgressPicture.schemas import ProgressPicture
from src.api.schemas import (
    LogEntryRequest,
    PhaseExisting, PhaseNew,
    SleepExisting, SleepNew,
    HydrationExisting, HydrationNew,
    ActivityExisting, ActivityNew,
    CardioExisting, CardioNew,
    SupplementExisting, SupplementNew,
    StressExisting, StressNew,
)


class LogEntryRepository:
    def __init__(self, db: Session):
        self.db = db

    # =========================================================================
    # Helper methods for creating new entities inline
    # =========================================================================
    
    def _create_or_get_phase(self, phase_input) -> int | None:
        if phase_input is None:
            return None
        if isinstance(phase_input, PhaseExisting):
            return phase_input.id
        elif isinstance(phase_input, PhaseNew):
            model = PhaseModel(name=phase_input.name)
            self.db.add(model)
            self.db.flush()
            return model.id
        return None

    def _create_or_get_sleep(self, sleep_input) -> int | None:
        if sleep_input is None:
            return None
        if isinstance(sleep_input, SleepExisting):
            return sleep_input.id
        elif isinstance(sleep_input, SleepNew):
            naps_data = [{"duration": n.duration} for n in sleep_input.naps]
            model = SleepModel(
                date=sleep_input.date,
                duration=sleep_input.duration,
                quality=sleep_input.quality,
                notes=sleep_input.notes,
                naps=naps_data
            )
            self.db.add(model)
            self.db.flush()
            return model.id
        return None

    def _create_or_get_hydration(self, hydration_input) -> list[int] | None:
        if not hydration_input:
            return None
        hydration_ids = []
        for hydration in hydration_input:
            if isinstance(hydration, HydrationExisting):
                hydration_ids.append(hydration.id)
            elif isinstance(hydration, HydrationNew):
                model = HydrationModel(
                    timestamp=hydration.timestamp,
                    cup_id=hydration.cup_id,
                    servings=hydration.servings
                )
                self.db.add(model)
                self.db.flush()
                hydration_ids.append(model.id)
        return hydration_ids if hydration_ids else None

    def _create_or_get_activities(self, activities_input) -> list[int] | None:
        if not activities_input:
            return None
        activity_ids = []
        for activity in activities_input:
            if isinstance(activity, ActivityExisting):
                activity_ids.append(activity.id)
            elif isinstance(activity, ActivityNew):
                model = ActivityModel(
                    workout_id=activity.workout_id,
                    time=activity.time,
                    notes=activity.notes
                )
                self.db.add(model)
                self.db.flush()
                
                for position, ex in enumerate(activity.exercises):
                    ex_model = ActivityExerciseModel(
                        activity_id=model.id,
                        exercise_id=ex.exercise_id,
                        position=position,
                        session_notes=ex.session_notes
                    )
                    self.db.add(ex_model)
                    self.db.flush()
                    
                    for s in ex.sets:
                        set_model = ActivitySetModel(
                            activity_exercise_id=ex_model.id,
                            reps=s.reps,
                            weight=s.weight,
                            unit=s.unit.value if s.unit else None,
                            rir=s.rir,
                            notes=s.notes
                        )
                        self.db.add(set_model)
                
                activity_ids.append(model.id)
        return activity_ids if activity_ids else None

    def _create_or_get_cardio(self, cardio_input) -> list[int] | None:
        if not cardio_input:
            return None
        cardio_ids = []
        for cardio in cardio_input:
            if isinstance(cardio, CardioExisting):
                cardio_ids.append(cardio.id)
            elif isinstance(cardio, CardioNew):
                model = CardioModel(
                    name=cardio.name,
                    time=cardio.time,
                    exercise_type=cardio.exercise.type,
                    exercise_data=cardio.exercise.model_dump()
                )
                self.db.add(model)
                self.db.flush()
                cardio_ids.append(model.id)
        return cardio_ids if cardio_ids else None

    def _create_or_get_supplements(self, supplements_input) -> list[dict] | None:
        """Returns list of {"supplement_id": int, "servings": float}"""
        if not supplements_input:
            return None
        supplement_data = []
        for supp in supplements_input:
            if isinstance(supp, SupplementExisting):
                supplement_data.append({"supplement_id": supp.id, "servings": supp.servings})
            elif isinstance(supp, SupplementNew):
                model = SupplementModel(
                    brand=supp.brand,
                    name=supp.name,
                    serving_name=supp.serving_name
                )
                self.db.add(model)
                self.db.flush()
                
                # Add compound associations
                for comp_req in supp.compounds:
                    sc = SupplementCompoundModel(
                        supplement_id=model.id,
                        compound_id=comp_req.compound_id,
                        amount=comp_req.amount
                    )
                    self.db.add(sc)
                
                supplement_data.append({"supplement_id": model.id, "servings": supp.servings})
        return supplement_data if supplement_data else None

    def _create_or_get_stress(self, stress_input) -> int | None:
        if stress_input is None:
            return None
        if isinstance(stress_input, StressExisting):
            return stress_input.id
        elif isinstance(stress_input, StressNew):
            model = StressModel(
                timestamp=stress_input.timestamp,
                level=stress_input.level.value,
                notes=stress_input.notes
            )
            self.db.add(model)
            self.db.flush()
            return model.id
        return None

    # =========================================================================
    # Helper methods for handling log entry foods
    # =========================================================================

    def _set_log_entry_foods(self, log_entry_id: int, foods_input) -> None:
        """Set the foods for a log entry (replaces existing foods)"""
        # Delete existing foods for this log entry
        self.db.query(LogEntryFoodModel).filter(
            LogEntryFoodModel.log_entry_id == log_entry_id
        ).delete()
        
        if not foods_input:
            return
        
        # Add new foods
        for food_input in foods_input:
            food_model = LogEntryFoodModel(
                log_entry_id=log_entry_id,
                food_id=food_input.food_id,
                servings=food_input.servings
            )
            self.db.add(food_model)

    def _get_log_entry_foods(self, log_entry_id: int) -> list[MealFood] | None:
        """Get foods for a log entry"""
        food_repo = FoodRepository(self.db)
        food_models = self.db.query(LogEntryFoodModel).filter(
            LogEntryFoodModel.log_entry_id == log_entry_id
        ).all()
        
        if not food_models:
            return None
        
        foods = []
        for fm in food_models:
            foods.append(MealFood(
                food=food_repo._model_to_schema(fm.food),
                servings=fm.servings
            ))
        return foods if foods else None

    # =========================================================================
    # Helper methods for handling log entry supplements
    # =========================================================================

    def _set_log_entry_supplements(self, log_entry_id: int, supplements_data: list[dict] | None) -> None:
        """Set the supplements for a log entry (replaces existing supplements)
        supplements_data: list of {"supplement_id": int, "servings": float}
        """
        # Delete existing supplements for this log entry
        self.db.query(LogEntrySupplementModel).filter(
            LogEntrySupplementModel.log_entry_id == log_entry_id
        ).delete()
        
        if not supplements_data:
            return
        
        # Add new supplements
        for supp_data in supplements_data:
            supp_model = LogEntrySupplementModel(
                log_entry_id=log_entry_id,
                supplement_id=supp_data["supplement_id"],
                servings=supp_data["servings"]
            )
            self.db.add(supp_model)

    def _get_log_entry_supplements(self, log_entry_id: int) -> list[LogEntrySupplement] | None:
        """Get supplements for a log entry"""
        supp_models = self.db.query(LogEntrySupplementModel).filter(
            LogEntrySupplementModel.log_entry_id == log_entry_id
        ).all()
        
        if not supp_models:
            return None
        
        supplements = []
        for sm in supp_models:
            if sm.supplement is None:
                continue
            # Build the supplement schema
            compounds = []
            for sc in sm.supplement.supplement_compounds:
                if sc.compound is None:
                    continue
                compound = Compound(
                    id=sc.compound.id,
                    name=sc.compound.name,
                    unit=CompoundUnit(sc.compound.unit)
                )
                compounds.append(SupplementCompound(
                    compound=compound,
                    amount=sc.amount
                ))
            supplement = Supplement(
                id=sm.supplement.id,
                brand=sm.supplement.brand,
                name=sm.supplement.name,
                serving_name=sm.supplement.serving_name,
                compounds=compounds
            )
            supplements.append(LogEntrySupplement(
                supplement=supplement,
                servings=sm.servings
            ))
        return supplements if supplements else None

    # =========================================================================
    # Helper methods for fetching related entities (for response)
    # =========================================================================

    def _get_phase(self, phase_id: int | None) -> Phase | None:
        if phase_id is None:
            return None
        model = self.db.query(PhaseModel).filter(PhaseModel.id == phase_id).first()
        if model is None:
            return None
        return Phase(id=model.id, name=model.name)

    def _get_sleep(self, sleep_id: int | None) -> Sleep | None:
        if sleep_id is None:
            return None
        model = self.db.query(SleepModel).filter(SleepModel.id == sleep_id).first()
        if model is None:
            return None
        naps = [Nap(id=i, date=model.date, duration=n["duration"]) 
                for i, n in enumerate(model.naps or [], start=1)]
        return Sleep(
            id=model.id,
            date=model.date,
            duration=model.duration,
            quality=model.quality,
            notes=model.notes,
            naps=naps
        )

    def _get_hydration(self, hydration_ids: list[int] | None) -> list[Hydration] | None:
        if not hydration_ids:
            return None
        hydrations = []
        for hydration_id in hydration_ids:
            model = self.db.query(HydrationModel).filter(HydrationModel.id == hydration_id).first()
            if model:
                cup = Cup(
                    id=model.cup.id,
                    name=model.cup.name,
                    amount=model.cup.amount,
                    unit=HydrationUnit(model.cup.unit)
                )
                hydrations.append(Hydration(
                    id=model.id,
                    timestamp=model.timestamp,
                    cup=cup,
                    servings=model.servings
                ))
        return hydrations if hydrations else None

    def _get_activities(self, log_entry_id: int) -> list[Activity] | None:
        """Get activities for a log entry"""
        activity_links = self.db.query(LogEntryActivityModel).filter(
            LogEntryActivityModel.log_entry_id == log_entry_id
        ).all()
        
        if not activity_links:
            return None
        
        activities = []
        for link in activity_links:
            model = link.activity
            if model:
                exercises = []
                for ex in model.exercises:
                    sets = []
                    for s in ex.sets:
                        sets.append(ActivitySet(
                            id=s.id,
                            reps=s.reps,
                            weight=s.weight,
                            unit=Unit(s.unit) if s.unit else None,
                            rir=s.rir,
                            notes=s.notes
                        ))
                    
                    exercise = Exercise(
                        id=ex.exercise.id,
                        name=ex.exercise.name,
                        movement_pattern_id=ex.exercise.movement_pattern_id,
                        notes=ex.exercise.notes
                    )
                    
                    exercises.append(ActivityExercise(
                        id=ex.id,
                        exercise=exercise,
                        position=ex.position,
                        session_notes=ex.session_notes,
                        sets=sets
                    ))
                
                # Include workout info if available
                workout_info = None
                if model.workout:
                    workout_info = ActivityWorkout(
                        id=model.workout.id,
                        name=model.workout.name,
                        description=model.workout.description
                    )
                
                activities.append(Activity(
                    id=model.id,
                    workout_id=model.workout_id,
                    workout=workout_info,
                    time=model.time,
                    notes=model.notes,
                    exercises=exercises
                ))
        return activities if activities else None

    def _get_cardio(self, cardio_ids: list[int] | None) -> list[Cardio] | None:
        if not cardio_ids:
            return None
        cardio_repo = CardioRepository(self.db)
        cardios = []
        for cardio_id in cardio_ids:
            cardio = cardio_repo.get_by_id(cardio_id)
            if cardio:
                cardios.append(cardio)
        return cardios if cardios else None


    def _get_stress(self, stress_id: int | None) -> Stress | None:
        if stress_id is None:
            return None
        model = self.db.query(StressModel).filter(StressModel.id == stress_id).first()
        if model is None:
            return None
        return Stress(
            id=model.id,
            timestamp=model.timestamp,
            level=StressLevel(model.level),
            notes=model.notes
        )

    def _get_carb_cycle(self, carb_cycle_day_id: int | None) -> LogEntryCarbCycle | None:
        if carb_cycle_day_id is None:
            return None
        day_model = self.db.query(CarbCycleDayModel).filter(
            CarbCycleDayModel.id == carb_cycle_day_id
        ).first()
        if day_model is None:
            return None
        
        cycle_model = day_model.carb_cycle
        if cycle_model is None:
            return None
        
        # Build carb cycle with all days
        days = [
            CarbCycleDay(
                id=d.id,
                day_type=CarbCycleDayType(d.day_type),
                carbs=d.carbs,
                position=d.position
            )
            for d in cycle_model.days
        ]
        
        carb_cycle = CarbCycle(
            id=cycle_model.id,
            name=cycle_model.name,
            description=cycle_model.description,
            days=days
        )
        
        selected_day = CarbCycleDay(
            id=day_model.id,
            day_type=CarbCycleDayType(day_model.day_type),
            carbs=day_model.carbs,
            position=day_model.position
        )
        
        return LogEntryCarbCycle(
            carb_cycle=carb_cycle,
            selected_day=selected_day
        )

    def _get_progress_pictures(self, log_entry_id: int) -> list[ProgressPicture] | None:
        """Get progress pictures for a log entry"""
        models = self.db.query(ProgressPictureModel).filter(
            ProgressPictureModel.log_entry_id == log_entry_id
        ).order_by(ProgressPictureModel.created_at.desc()).all()
        
        if not models:
            return None
        
        pictures = []
        for m in models:
            pictures.append(ProgressPicture(
                id=m.id,
                label=m.label,
                filename=m.filename,
                original_filename=m.original_filename,
                mime_type=m.mime_type,
                created_at=m.created_at,
                url=f"/api/progress-pictures/file/{m.filename}"
            ))
        return pictures if pictures else None

    def _set_log_entry_activities(self, log_entry_id: int, activity_ids: list[int] | None) -> None:
        """Set the activities for a log entry (replaces existing activities)"""
        # Delete existing activity links for this log entry
        self.db.query(LogEntryActivityModel).filter(
            LogEntryActivityModel.log_entry_id == log_entry_id
        ).delete()
        
        if not activity_ids:
            return
        
        # Add new activity links
        for activity_id in activity_ids:
            link = LogEntryActivityModel(
                log_entry_id=log_entry_id,
                activity_id=activity_id
            )
            self.db.add(link)

    def _model_to_schema(self, model: LogEntryModel) -> LogEntry:
        return LogEntry(
            id=model.id,
            timestamp=model.timestamp,
            phase=self._get_phase(model.phase_id),
            morning_weight=model.morning_weight,
            sleep=self._get_sleep(model.sleep_id),
            hydration=self._get_hydration(model.hydration_ids),
            foods=self._get_log_entry_foods(model.id),
            activities=self._get_activities(model.id),
            cardio=self._get_cardio(model.cardio_ids),
            supplements=self._get_log_entry_supplements(model.id),
            stress=self._get_stress(model.stress_id),
            num_standard_drinks=model.num_standard_drinks,
            notes=model.notes,
            carb_cycle=self._get_carb_cycle(model.carb_cycle_day_id),
            progress_pictures=self._get_progress_pictures(model.id),
        )

    # =========================================================================
    # CRUD Operations
    # =========================================================================

    def get_by_id(self, log_entry_id: int) -> LogEntry | None:
        model = self.db.query(LogEntryModel).filter(LogEntryModel.id == log_entry_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[LogEntry]:
        models = self.db.query(LogEntryModel).all()
        return [self._model_to_schema(m) for m in models]

    def get_by_date(self, date_str: str) -> LogEntry | None:
        """Get log entry by date (YYYY-MM-DD format). Matches entries where timestamp date equals the given date."""
        from sqlalchemy import func
        model = self.db.query(LogEntryModel).filter(
            func.date(LogEntryModel.timestamp) == date_str
        ).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def create(self, log_entry: LogEntryRequest) -> LogEntry:
        # Process all inputs - create new entities or get existing IDs
        phase_id = self._create_or_get_phase(log_entry.phase)
        sleep_id = self._create_or_get_sleep(log_entry.sleep)
        hydration_ids = self._create_or_get_hydration(log_entry.hydration)
        activity_ids = self._create_or_get_activities(log_entry.activities)
        cardio_ids = self._create_or_get_cardio(log_entry.cardio)
        supplements_data = self._create_or_get_supplements(log_entry.supplements)
        stress_id = self._create_or_get_stress(log_entry.stress)

        model = LogEntryModel(
            timestamp=log_entry.timestamp,
            phase_id=phase_id,
            morning_weight=log_entry.morning_weight,
            sleep_id=sleep_id,
            hydration_ids=hydration_ids,
            cardio_ids=cardio_ids,
            stress_id=stress_id,
            num_standard_drinks=log_entry.num_standard_drinks,
            notes=log_entry.notes,
            carb_cycle_day_id=log_entry.carb_cycle_day_id,
        )
        self.db.add(model)
        self.db.flush()
        
        # Set foods for this log entry
        self._set_log_entry_foods(model.id, log_entry.foods)
        # Set supplements for this log entry
        self._set_log_entry_supplements(model.id, supplements_data)
        # Set activities for this log entry
        self._set_log_entry_activities(model.id, activity_ids)
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, log_entry_id: int, log_entry: LogEntryRequest) -> LogEntry | None:
        model = self.db.query(LogEntryModel).filter(LogEntryModel.id == log_entry_id).first()
        if model is None:
            return None
        
        # Process all inputs - create new entities or get existing IDs
        phase_id = self._create_or_get_phase(log_entry.phase)
        sleep_id = self._create_or_get_sleep(log_entry.sleep)
        hydration_ids = self._create_or_get_hydration(log_entry.hydration)
        activity_ids = self._create_or_get_activities(log_entry.activities)
        cardio_ids = self._create_or_get_cardio(log_entry.cardio)
        supplements_data = self._create_or_get_supplements(log_entry.supplements)
        stress_id = self._create_or_get_stress(log_entry.stress)

        model.timestamp = log_entry.timestamp
        model.phase_id = phase_id
        model.morning_weight = log_entry.morning_weight
        model.sleep_id = sleep_id
        model.hydration_ids = hydration_ids
        model.cardio_ids = cardio_ids
        model.stress_id = stress_id
        model.num_standard_drinks = log_entry.num_standard_drinks
        model.notes = log_entry.notes
        model.carb_cycle_day_id = log_entry.carb_cycle_day_id
        
        # Update foods for this log entry
        self._set_log_entry_foods(model.id, log_entry.foods)
        # Update supplements for this log entry
        self._set_log_entry_supplements(model.id, supplements_data)
        # Update activities for this log entry
        self._set_log_entry_activities(model.id, activity_ids)
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, log_entry_id: int) -> LogEntry | None:
        model = self.db.query(LogEntryModel).filter(LogEntryModel.id == log_entry_id).first()
        if model is None:
            return None
        log_entry = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return log_entry

    def delete_all(self) -> list[LogEntry]:
        models = self.db.query(LogEntryModel).all()
        log_entries = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return log_entries
