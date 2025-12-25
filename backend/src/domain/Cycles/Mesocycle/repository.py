from sqlalchemy.orm import Session
from src.domain.Cycles.Mesocycle.models import (
    MesocycleModel,
    MicrocycleModel,
    MicrocycleDayModel,
)
from src.domain.Cycles.Mesocycle.schemas import (
    Mesocycle,
    Microcycle,
    MicrocycleRequest,
)
from src.domain.Workout.schemas import Workout
from src.domain.Workout.models import WorkoutModel
from src.domain.Workout.repository import WorkoutRepository


class MesocycleRepository:
    def __init__(self, db: Session):
        self.db = db
        self.workout_repo = WorkoutRepository(db)

    def _get_workout_or_rest(self, workout_id: int) -> Workout:
        """Get workout by ID, or return a rest day placeholder for ID 0"""
        if workout_id == 0:
            # Rest day - return a placeholder workout
            return Workout(id=0, name="Rest Day", description="Recovery day", items=[])
        
        workout = self.workout_repo.get_by_id(workout_id)
        if workout:
            return workout
        # Fallback if workout not found
        return Workout(id=workout_id, name="Unknown Workout", items=[])

    def _microcycle_model_to_schema(self, model: MicrocycleModel) -> Microcycle:
        # Get workouts for each day in order
        workouts = []
        for day in sorted(model.days, key=lambda d: d.position):
            workout = self._get_workout_or_rest(day.workout_id or 0)
            workouts.append(workout)
        
        return Microcycle(
            id=model.id,
            name=model.name,
            position=model.position,
            description=model.description,
            workouts=workouts,
        )

    def _model_to_schema(self, model: MesocycleModel) -> Mesocycle:
        return Mesocycle(
            id=model.id,
            name=model.name,
            description=model.description,
            start_date=model.start_date,
            end_date=model.end_date,
            microcycles=[self._microcycle_model_to_schema(m) for m in model.microcycles],
        )

    def get_by_id(self, mesocycle_id: int) -> Mesocycle | None:
        model = self.db.query(MesocycleModel).filter(
            MesocycleModel.id == mesocycle_id
        ).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Mesocycle]:
        models = self.db.query(MesocycleModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(
        self,
        name: str,
        description: str | None,
        start_date,
        end_date,
        microcycles: list[MicrocycleRequest],
    ) -> Mesocycle:
        model = MesocycleModel(
            name=name,
            description=description,
            start_date=start_date,
            end_date=end_date,
        )
        self.db.add(model)
        self.db.flush()

        for position, microcycle in enumerate(microcycles):
            microcycle_model = MicrocycleModel(
                mesocycle_id=model.id,
                name=microcycle.name,
                position=position,
                description=microcycle.description,
            )
            self.db.add(microcycle_model)
            self.db.flush()

            # Add days (workouts) to microcycle
            for day_position, workout_id in enumerate(microcycle.workout_ids):
                day_model = MicrocycleDayModel(
                    microcycle_id=microcycle_model.id,
                    position=day_position,
                    workout_id=workout_id if workout_id != 0 else None,
                )
                self.db.add(day_model)

        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(
        self,
        mesocycle_id: int,
        name: str,
        description: str | None,
        start_date,
        end_date,
        microcycles: list[MicrocycleRequest],
    ) -> Mesocycle | None:
        model = self.db.query(MesocycleModel).filter(
            MesocycleModel.id == mesocycle_id
        ).first()
        if model is None:
            return None

        model.name = name
        model.description = description
        model.start_date = start_date
        model.end_date = end_date

        # Delete existing days first, then microcycles (bulk delete doesn't trigger cascade)
        microcycle_ids = [m.id for m in model.microcycles]
        if microcycle_ids:
            self.db.query(MicrocycleDayModel).filter(
                MicrocycleDayModel.microcycle_id.in_(microcycle_ids)
            ).delete(synchronize_session='fetch')
            self.db.query(MicrocycleModel).filter(
                MicrocycleModel.mesocycle_id == mesocycle_id
            ).delete(synchronize_session='fetch')

        # Add new microcycles
        for position, microcycle in enumerate(microcycles):
            microcycle_model = MicrocycleModel(
                mesocycle_id=model.id,
                name=microcycle.name,
                position=position,
                description=microcycle.description,
            )
            self.db.add(microcycle_model)
            self.db.flush()

            # Add days (workouts) to microcycle
            for day_position, workout_id in enumerate(microcycle.workout_ids):
                day_model = MicrocycleDayModel(
                    microcycle_id=microcycle_model.id,
                    position=day_position,
                    workout_id=workout_id if workout_id != 0 else None,
                )
                self.db.add(day_model)

        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, mesocycle_id: int) -> Mesocycle | None:
        model = self.db.query(MesocycleModel).filter(
            MesocycleModel.id == mesocycle_id
        ).first()
        if model is None:
            return None
        mesocycle = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return mesocycle

    def delete_all(self) -> list[Mesocycle]:
        models = self.db.query(MesocycleModel).all()
        mesocycles = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return mesocycles

