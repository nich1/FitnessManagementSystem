from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.domain.Stats import stats_service
from src.domain.Stats.schemas import (
    StatsQueryRequest, StatsQueryResponse,
    StatsConfiguration, StatsConfigurationRequest,
    MetricType, DateRangeType, AggregationType
)

stats_router = APIRouter(prefix="/api/stats", tags=["stats"])


@stats_router.post("/query", response_model=StatsQueryResponse)
def query_stats(request: StatsQueryRequest, db: Session = Depends(get_db)):
    """Query statistics based on metrics, date range, and aggregation"""
    return stats_service.query_stats(db, request)


@stats_router.get("/metrics")
def get_available_metrics():
    """Get list of available metrics"""
    return [{"value": m.value, "label": m.value.replace("_", " ").title()} for m in MetricType]


@stats_router.get("/date-range-types")
def get_date_range_types():
    """Get list of available date range types"""
    return [{"value": d.value, "label": d.value.replace("_", " ").title()} for d in DateRangeType]


@stats_router.get("/aggregation-types")
def get_aggregation_types():
    """Get list of available aggregation types"""
    return [{"value": a.value, "label": a.value.title()} for a in AggregationType]


# Configuration endpoints
@stats_router.get("/configurations", response_model=list[StatsConfiguration])
def get_configurations(db: Session = Depends(get_db)):
    """Get all saved statistics configurations"""
    return stats_service.get_all_configurations(db)


@stats_router.get("/configurations/{config_id}", response_model=StatsConfiguration)
def get_configuration(config_id: int, db: Session = Depends(get_db)):
    """Get a specific configuration"""
    config = stats_service.get_configuration(db, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return config


@stats_router.post("/configurations", response_model=StatsConfiguration)
def create_configuration(request: StatsConfigurationRequest, db: Session = Depends(get_db)):
    """Create a new statistics configuration"""
    return stats_service.create_configuration(db, request)


@stats_router.put("/configurations/{config_id}", response_model=StatsConfiguration)
def update_configuration(config_id: int, request: StatsConfigurationRequest, db: Session = Depends(get_db)):
    """Update a configuration"""
    config = stats_service.update_configuration(db, config_id, request)
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return config


@stats_router.delete("/configurations/{config_id}")
def delete_configuration(config_id: int, db: Session = Depends(get_db)):
    """Delete a configuration"""
    if not stats_service.delete_configuration(db, config_id):
        raise HTTPException(status_code=404, detail="Configuration not found")
    return {"status": "deleted"}

