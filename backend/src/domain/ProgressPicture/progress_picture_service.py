from sqlalchemy.orm import Session
from .repository import ProgressPictureRepository
from .schemas import ProgressPicture


def get_progress_picture(db: Session, picture_id: int) -> ProgressPicture | None:
    repo = ProgressPictureRepository(db)
    return repo.get_by_id(picture_id)


def get_progress_pictures_by_log_entry(db: Session, log_entry_id: int) -> list[ProgressPicture]:
    repo = ProgressPictureRepository(db)
    return repo.get_by_log_entry(log_entry_id)


def create_progress_picture(
    db: Session,
    log_entry_id: int,
    filename: str,
    original_filename: str,
    mime_type: str,
    label: str | None = None
) -> ProgressPicture:
    repo = ProgressPictureRepository(db)
    return repo.create(log_entry_id, filename, original_filename, mime_type, label)


def update_progress_picture_label(db: Session, picture_id: int, label: str | None) -> ProgressPicture | None:
    repo = ProgressPictureRepository(db)
    return repo.update_label(picture_id, label)


def delete_progress_picture(db: Session, picture_id: int) -> str | None:
    """Delete a picture and return the filename for cleanup"""
    repo = ProgressPictureRepository(db)
    return repo.delete(picture_id)

