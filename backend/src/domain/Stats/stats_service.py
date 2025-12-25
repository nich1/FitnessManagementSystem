from sqlalchemy.orm import Session
from .repository import StatsRepository, StatsConfigurationRepository
from .schemas import (
    StatsQueryRequest, StatsQueryResponse,
    StatsConfiguration, StatsConfigurationRequest
)


def query_stats(db: Session, request: StatsQueryRequest) -> StatsQueryResponse:
    repo = StatsRepository(db)
    return repo.query_stats(request)


def get_all_configurations(db: Session) -> list[StatsConfiguration]:
    repo = StatsConfigurationRepository(db)
    return repo.get_all()


def get_configuration(db: Session, config_id: int) -> StatsConfiguration | None:
    repo = StatsConfigurationRepository(db)
    return repo.get_by_id(config_id)


def create_configuration(db: Session, request: StatsConfigurationRequest) -> StatsConfiguration:
    repo = StatsConfigurationRepository(db)
    return repo.create(request)


def update_configuration(db: Session, config_id: int, request: StatsConfigurationRequest) -> StatsConfiguration | None:
    repo = StatsConfigurationRepository(db)
    return repo.update(config_id, request)


def delete_configuration(db: Session, config_id: int) -> bool:
    repo = StatsConfigurationRepository(db)
    return repo.delete(config_id)

