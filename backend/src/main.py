from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from src.api.food import food_router
from src.api.meal import meal_router
from src.api.exercise import exercise_router
from src.api.cardio import cardio_router
from src.api.sleep import sleep_router
from src.api.stress import stress_router
from src.api.workout import workout_router
from src.api.activity import activity_router
from src.api.movement_pattern import movement_pattern_router
from src.api.phase import phase_router
from src.api.hydration import hydration_router
from src.api.cup import cup_router
from src.api.log_entry import log_entry_router
from src.api.supplement import supplement_router
from src.api.compound import compound_router
from src.api.carb_cycle import carb_cycle_router
from src.api.supplement_cycle import supplement_cycle_router
from src.api.mesocycle import mesocycle_router
from src.api.progress_picture import progress_picture_router
from src.api.stats import stats_router
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
    
app.include_router(log_entry_router)
app.include_router(food_router)
app.include_router(meal_router)
app.include_router(exercise_router)
app.include_router(movement_pattern_router)
app.include_router(workout_router)
app.include_router(activity_router)
app.include_router(cardio_router)
app.include_router(sleep_router)
app.include_router(stress_router)
app.include_router(hydration_router)
app.include_router(cup_router)
app.include_router(supplement_router)
app.include_router(compound_router)
app.include_router(phase_router)
app.include_router(carb_cycle_router)
app.include_router(supplement_cycle_router)
app.include_router(mesocycle_router)
app.include_router(progress_picture_router)
app.include_router(stats_router)

