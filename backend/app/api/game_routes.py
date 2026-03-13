from fastapi import APIRouter, HTTPException, Query, status

from app.models.schemas import (
	ErrorResponse,
	FireRequest,
	GameStateResponse,
	PlaceShipsRequest,
	StartGameRequest,
	StartGameResponse,
	TurnResult,
)
from app.services.game_service import GameService

router = APIRouter(prefix="/game", tags=["game"])


def get_service() -> GameService:
	return GameService.get_instance()


@router.post(
	"/start",
	response_model=StartGameResponse,
	status_code=status.HTTP_201_CREATED,
	responses={
		400: {"model": ErrorResponse},
		500: {"model": ErrorResponse},
	},
)
async def start_game(request: StartGameRequest = StartGameRequest()):
	try:
		service = get_service()
		return await service.start_game(difficulty=request.difficulty)
	except ValueError as e:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=str(e),
		)
	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail=str(e),
		)


@router.post(
	"/place-ships",
	response_model=GameStateResponse,
	status_code=status.HTTP_200_OK,
	responses={
		400: {"model": ErrorResponse},
		404: {"model": ErrorResponse},
	},
)
async def place_ships(request: PlaceShipsRequest):
	try:
		service = get_service()
		return await service.place_ships(request)
	except ValueError as e:
		error_msg = str(e)
		if "not found" in error_msg:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail=error_msg,
			)
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=error_msg,
		)
	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail=str(e),
		)


@router.post(
	"/fire",
	response_model=TurnResult,
	status_code=status.HTTP_200_OK,
	responses={
		400: {"model": ErrorResponse},
		404: {"model": ErrorResponse},
	},
)
async def fire(request: FireRequest):
	try:
		service = get_service()
		return await service.fire(request)
	except ValueError as e:
		error_msg = str(e)
		if "not found" in error_msg:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail=error_msg,
			)
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=error_msg,
		)
	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail=str(e),
		)


@router.get(
	"/state",
	response_model=GameStateResponse,
	status_code=status.HTTP_200_OK,
	responses={404: {"model": ErrorResponse}},
)
async def get_state(game_id: str = Query(...)):
	try:
		service = get_service()
		return await service.get_state(game_id)
	except ValueError as e:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=str(e),
		)
	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail=str(e),
		)
