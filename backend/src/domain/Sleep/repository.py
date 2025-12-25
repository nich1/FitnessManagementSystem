from sqlalchemy.orm import Session
from src.domain.Sleep.models import SleepModel
from src.domain.Sleep.schemas import Sleep, Nap
from src.api.schemas import SleepRequest


class SleepRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: SleepModel) -> Sleep:
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

    def get_by_id(self, sleep_id: int) -> Sleep | None:
        model = self.db.query(SleepModel).filter(SleepModel.id == sleep_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Sleep]:
        models = self.db.query(SleepModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, sleep: SleepRequest) -> Sleep:
        naps_data = [{"duration": n.duration} for n in sleep.naps]
        model = SleepModel(
            date=sleep.date,
            duration=sleep.duration,
            quality=sleep.quality,
            notes=sleep.notes,
            naps=naps_data
        )
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, sleep_id: int, sleep: SleepRequest) -> Sleep | None:
        model = self.db.query(SleepModel).filter(SleepModel.id == sleep_id).first()
        if model is None:
            return None
        
        naps_data = [{"duration": n.duration} for n in sleep.naps]
        model.date = sleep.date
        model.duration = sleep.duration
        model.quality = sleep.quality
        model.notes = sleep.notes
        model.naps = naps_data
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, sleep_id: int) -> Sleep | None:
        model = self.db.query(SleepModel).filter(SleepModel.id == sleep_id).first()
        if model is None:
            return None
        sleep = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return sleep

    def delete_all(self) -> list[Sleep]:
        models = self.db.query(SleepModel).all()
        sleeps = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return sleeps

