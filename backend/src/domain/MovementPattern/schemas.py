from pydantic import BaseModel


class MovementPattern(BaseModel):
    id: int
    name: str
    description: str | None = None


class MovementPatternWithExercises(MovementPattern):
    """Movement pattern with its associated exercises"""
    exercise_ids: list[int] = []

