from sqlalchemy.orm import Session
from src.domain.MovementPattern.repository import MovementPatternRepository
from src.domain.MovementPattern.schemas import MovementPattern, MovementPatternWithExercises


class MovementPatternService:
    def get_movement_pattern(self, db: Session, pattern_id: int) -> MovementPattern | None:
        return MovementPatternRepository(db).get_by_id(pattern_id)

    def get_all_movement_patterns(self, db: Session) -> list[MovementPatternWithExercises]:
        return MovementPatternRepository(db).get_all()

    def create_movement_pattern(self, db: Session, name: str, description: str | None = None) -> MovementPattern:
        return MovementPatternRepository(db).create(name, description)

    def update_movement_pattern(self, db: Session, pattern_id: int, name: str, description: str | None = None) -> MovementPattern | None:
        return MovementPatternRepository(db).update(pattern_id, name, description)

    def delete_movement_pattern(self, db: Session, pattern_id: int) -> MovementPattern | None:
        return MovementPatternRepository(db).delete(pattern_id)

    def delete_all_movement_patterns(self, db: Session) -> list[MovementPattern]:
        return MovementPatternRepository(db).delete_all()

