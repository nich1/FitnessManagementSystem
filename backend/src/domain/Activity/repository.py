from sqlalchemy.orm import Session
from src.domain.Activity.models import ActivityModel, ActivityExerciseModel, ActivitySetModel
from src.domain.Activity.schemas import Activity, ActivityExercise, ActivitySet, ActivityWorkout
from src.domain.Exercise.schemas import Exercise, Unit


class ActivityRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: ActivityModel) -> Activity:
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
        
        return Activity(
            id=model.id,
            workout_id=model.workout_id,
            workout=workout_info,
            time=model.time,
            notes=model.notes,
            exercises=exercises
        )

    def get_by_id(self, activity_id: int) -> Activity | None:
        model = self.db.query(ActivityModel).filter(ActivityModel.id == activity_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Activity]:
        models = self.db.query(ActivityModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, time, workout_id: int | None, notes: str | None, exercises: list[dict]) -> Activity:
        """
        exercises: list of {
            "exercise_id": int,
            "session_notes": str | None,
            "sets": [{"reps": int, "weight": float, "unit": str | None, "rir": int | None, "notes": str | None}]
        }
        """
        model = ActivityModel(
            workout_id=workout_id,
            time=time,
            notes=notes
        )
        self.db.add(model)
        self.db.flush()
        
        for position, ex_data in enumerate(exercises):
            ex_model = ActivityExerciseModel(
                activity_id=model.id,
                exercise_id=ex_data["exercise_id"],
                position=position,
                session_notes=ex_data.get("session_notes")
            )
            self.db.add(ex_model)
            self.db.flush()
            
            for set_data in ex_data.get("sets", []):
                set_model = ActivitySetModel(
                    activity_exercise_id=ex_model.id,
                    reps=set_data["reps"],
                    weight=set_data["weight"],
                    unit=set_data.get("unit"),
                    rir=set_data.get("rir"),
                    notes=set_data.get("notes")
                )
                self.db.add(set_model)
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, activity_id: int, time, workout_id: int | None, notes: str | None, exercises: list[dict]) -> Activity | None:
        model = self.db.query(ActivityModel).filter(ActivityModel.id == activity_id).first()
        if model is None:
            return None
        
        model.workout_id = workout_id
        model.time = time
        model.notes = notes
        
        # Delete existing exercises and sets
        for ex in model.exercises:
            for s in ex.sets:
                self.db.delete(s)
            self.db.delete(ex)
        
        # Add new exercises and sets
        for position, ex_data in enumerate(exercises):
            ex_model = ActivityExerciseModel(
                activity_id=model.id,
                exercise_id=ex_data["exercise_id"],
                position=position,
                session_notes=ex_data.get("session_notes")
            )
            self.db.add(ex_model)
            self.db.flush()
            
            for set_data in ex_data.get("sets", []):
                set_model = ActivitySetModel(
                    activity_exercise_id=ex_model.id,
                    reps=set_data["reps"],
                    weight=set_data["weight"],
                    unit=set_data.get("unit"),
                    rir=set_data.get("rir"),
                    notes=set_data.get("notes")
                )
                self.db.add(set_model)
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, activity_id: int) -> Activity | None:
        model = self.db.query(ActivityModel).filter(ActivityModel.id == activity_id).first()
        if model is None:
            return None
        activity = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return activity

    def delete_all(self) -> list[Activity]:
        models = self.db.query(ActivityModel).all()
        activities = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return activities

