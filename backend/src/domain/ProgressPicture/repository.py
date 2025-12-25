from sqlalchemy.orm import Session
from .models import ProgressPictureModel
from .schemas import ProgressPicture


class ProgressPictureRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: ProgressPictureModel) -> ProgressPicture:
        return ProgressPicture(
            id=model.id,
            label=model.label,
            filename=model.filename,
            original_filename=model.original_filename,
            mime_type=model.mime_type,
            created_at=model.created_at,
            url=f"/api/progress-pictures/file/{model.filename}"
        )

    def get_by_id(self, picture_id: int) -> ProgressPicture | None:
        model = self.db.query(ProgressPictureModel).filter(
            ProgressPictureModel.id == picture_id
        ).first()
        return self._model_to_schema(model) if model else None

    def get_by_log_entry(self, log_entry_id: int) -> list[ProgressPicture]:
        models = self.db.query(ProgressPictureModel).filter(
            ProgressPictureModel.log_entry_id == log_entry_id
        ).order_by(ProgressPictureModel.created_at.desc()).all()
        return [self._model_to_schema(m) for m in models]

    def create(
        self,
        log_entry_id: int,
        filename: str,
        original_filename: str,
        mime_type: str,
        label: str | None = None
    ) -> ProgressPicture:
        model = ProgressPictureModel(
            log_entry_id=log_entry_id,
            filename=filename,
            original_filename=original_filename,
            mime_type=mime_type,
            label=label
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update_label(self, picture_id: int, label: str | None) -> ProgressPicture | None:
        model = self.db.query(ProgressPictureModel).filter(
            ProgressPictureModel.id == picture_id
        ).first()
        if not model:
            return None
        model.label = label
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, picture_id: int) -> str | None:
        """Delete a picture and return the filename for file cleanup"""
        model = self.db.query(ProgressPictureModel).filter(
            ProgressPictureModel.id == picture_id
        ).first()
        if not model:
            return None
        filename = model.filename
        self.db.delete(model)
        self.db.commit()
        return filename

    def get_model_by_id(self, picture_id: int) -> ProgressPictureModel | None:
        """Get the raw model for file operations"""
        return self.db.query(ProgressPictureModel).filter(
            ProgressPictureModel.id == picture_id
        ).first()

