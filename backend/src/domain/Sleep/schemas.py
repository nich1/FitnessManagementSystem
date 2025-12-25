from pydantic import BaseModel
from datetime import date

class Nap(BaseModel):
    id: int
    date: date
    duration: int

class Sleep(BaseModel):
    id: int
    date: date
    duration: int
    quality: int
    notes: str | None = None
    naps: list[Nap]