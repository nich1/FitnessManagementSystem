from sqlalchemy.orm import Session
from src.domain.Cardio.schemas import Cardio
from src.domain.Cardio.repository import CardioRepository
from src.api.schemas import CardioRequest


class CardioService:
    def __init__(self, db: Session):
        self.repository = CardioRepository(db)

    def get_cardio(self, cardio_id: int) -> Cardio | None:
        return self.repository.get_by_id(cardio_id)

    def get_all_cardio(self) -> list[Cardio]:
        return self.repository.get_all()

    def create_cardio(self, cardio: CardioRequest) -> Cardio:
        return self.repository.create(cardio)

    def update_cardio(self, cardio_id: int, cardio: CardioRequest) -> Cardio | None:
        return self.repository.update(cardio_id, cardio)

    def delete_cardio(self, cardio_id: int) -> Cardio | None:
        return self.repository.delete(cardio_id)

    def delete_all_cardio(self) -> bool:
        self.repository.delete_all()
        return True

