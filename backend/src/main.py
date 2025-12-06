from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from src.api.food import food_router
from src.database import init_db
from src.swagger_ui import DARK_SWAGGER_HTML

app = FastAPI(
    title="Fitness Management System API",
    description="API for tracking calories, macros, micros, training, weight, etc.",
    version="0.1.0",
    docs_url=None,
)

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    return HTMLResponse(content=DARK_SWAGGER_HTML)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(food_router)
