from pydantic import BaseModel
from datetime import datetime


class ProgressPictureRequest(BaseModel):
    label: str | None = None


class ProgressPicture(BaseModel):
    id: int
    label: str | None = None
    filename: str
    original_filename: str
    mime_type: str
    created_at: datetime
    url: str  # Will be constructed from filename

