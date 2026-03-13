from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.game_routes import router as game_router

app = FastAPI(title="Battleship API", version="1.0.0")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(game_router)


@app.get("/health")
async def health_check():
	return {"status": "ok"}
