import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.game_routes import router as game_router

app = FastAPI(title="Battleship API", version="1.0.0")

allowed_origins = os.getenv(
	"CORS_ORIGINS", "http://localhost:5173,http://localhost:1420"
).split(",")

app.add_middleware(
	CORSMiddleware,
	allow_origins=allowed_origins,
	allow_credentials=True,
	allow_methods=["GET", "POST"],
	allow_headers=["Content-Type"],
)

app.include_router(game_router)


@app.get("/health")
async def health_check():
	return {"status": "ok"}
