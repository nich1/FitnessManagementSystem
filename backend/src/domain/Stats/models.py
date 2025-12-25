from sqlalchemy import Column, Integer, String, JSON, DateTime
from datetime import datetime
from src.database import Base


class StatsConfigurationModel(Base):
    """Saved statistics configuration/template"""
    __tablename__ = "stats_configurations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # Configuration stored as JSON for flexibility
    # Contains: metrics, date_range_type, date_range, aggregation, chart_type, etc.
    config = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

