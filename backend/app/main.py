from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.games import router as games_router
from app.api.history import router as history_router
from app.api.rooms import router as rooms_router
from app.api.ws import router as ws_router
from app.core.config import SettingsFactory
from app.core.db import DatabaseManager


@asynccontextmanager
async def lifespan(application: FastAPI):
    try:
        db = DatabaseManager.get_instance()
        await db.init_db()
    except Exception as e:
        raise RuntimeError(f"Failed to initialize application: {e}") from e
    yield
    try:
        await DatabaseManager.reset()
    except Exception:
        pass


app = FastAPI(title="Battleship API", version="2.0.0", lifespan=lifespan)

settings = SettingsFactory.get()
allowed_origins = settings.CORS_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms_router)
app.include_router(games_router)
app.include_router(history_router)
app.include_router(ws_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
