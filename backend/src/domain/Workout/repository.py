from sqlalchemy.orm import Session
from src.domain.Workout.models import WorkoutModel, WorkoutItemModel
from src.domain.Workout.schemas import Workout, WorkoutItem
from src.domain.Exercise.schemas import Exercise
from src.domain.MovementPattern.schemas import MovementPattern


class WorkoutRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: WorkoutModel) -> Workout:
        items = []
        for item in model.items:
            exercise = None
            movement_pattern = None
            
            if item.exercise:
                exercise = Exercise(
                    id=item.exercise.id,
                    name=item.exercise.name,
                    movement_pattern_id=item.exercise.movement_pattern_id,
                    notes=item.exercise.notes
                )
            
            if item.movement_pattern:
                movement_pattern = MovementPattern(
                    id=item.movement_pattern.id,
                    name=item.movement_pattern.name,
                    description=item.movement_pattern.description
                )
            
            items.append(WorkoutItem(
                id=item.id,
                position=item.position,
                exercise=exercise,
                movement_pattern=movement_pattern
            ))
        
        return Workout(
            id=model.id,
            name=model.name,
            description=model.description,
            items=items
        )

    def get_by_id(self, workout_id: int) -> Workout | None:
        model = self.db.query(WorkoutModel).filter(WorkoutModel.id == workout_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Workout]:
        models = self.db.query(WorkoutModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, name: str, description: str | None, items: list[dict]) -> Workout:
        """
        items: list of {"exercise_id": int | None, "movement_pattern_id": int | None}
        """
        model = WorkoutModel(
            name=name,
            description=description
        )
        self.db.add(model)
        self.db.flush()
        
        # Add items in order
        for position, item in enumerate(items):
            item_model = WorkoutItemModel(
                workout_id=model.id,
                position=position,
                exercise_id=item.get("exercise_id"),
                movement_pattern_id=item.get("movement_pattern_id")
            )
            self.db.add(item_model)
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, workout_id: int, name: str, description: str | None, items: list[dict]) -> Workout | None:
        model = self.db.query(WorkoutModel).filter(WorkoutModel.id == workout_id).first()
        if model is None:
            return None
        
        model.name = name
        model.description = description
        
        # Delete existing items
        self.db.query(WorkoutItemModel).filter(WorkoutItemModel.workout_id == workout_id).delete()
        
        # Add new items in order
        for position, item in enumerate(items):
            item_model = WorkoutItemModel(
                workout_id=model.id,
                position=position,
                exercise_id=item.get("exercise_id"),
                movement_pattern_id=item.get("movement_pattern_id")
            )
            self.db.add(item_model)
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, workout_id: int) -> Workout | None:
        model = self.db.query(WorkoutModel).filter(WorkoutModel.id == workout_id).first()
        if model is None:
            return None
        workout = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return workout

    def delete_all(self) -> list[Workout]:
        models = self.db.query(WorkoutModel).all()
        workouts = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return workouts
