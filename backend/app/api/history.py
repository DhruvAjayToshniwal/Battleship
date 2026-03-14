from fastapi import APIRouter, HTTPException, Query, status

from app.models.schemas import (
	ErrorResponse,
	GameHistoryDetailResponse,
	GameHistoryListResponse,
	GameHistorySummary,
	MoveDetail,
)
from app.services.history_service import HistoryService

router = APIRouter(prefix="/games", tags=["history"])


@router.get(
	"/history",
	response_model=GameHistoryListResponse,
	status_code=status.HTTP_200_OK,
	responses={500: {"model": ErrorResponse}},
)
async def get_history(
	limit: int = Query(default=20, ge=1, le=100),
	offset: int = Query(default=0, ge=0),
) -> GameHistoryListResponse:
	try:
		service = HistoryService.get_instance()
		games = await service.get_completed_games(limit, offset)
		return GameHistoryListResponse(games=[GameHistorySummary(**g) for g in games])
	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
		)


@router.get(
	"/history/{room_id}",
	response_model=GameHistoryDetailResponse,
	status_code=status.HTTP_200_OK,
	responses={
		404: {"model": ErrorResponse},
		500: {"model": ErrorResponse},
	},
)
async def get_game_detail(room_id: str) -> GameHistoryDetailResponse:
	try:
		service = HistoryService.get_instance()
		detail = await service.get_game_detail(room_id)
		if detail is None:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail=f"Game {room_id} not found",
			)
		return GameHistoryDetailResponse(
			room_id=detail["room_id"],
			room_code=detail["room_code"],
			mode=detail["mode"],
			status=detail["status"],
			winner_name=detail.get("winner_name"),
			winner_player_id=detail.get("winner_player_id"),
			duration_seconds=detail.get("duration_seconds"),
			created_at=detail.get("created_at"),
			players=detail.get("players", []),
			moves=[MoveDetail(**m) for m in detail.get("moves", [])],
		)
	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
		)
