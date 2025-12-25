from pydantic import BaseModel

class Phase(BaseModel):
    id: int
    name: str