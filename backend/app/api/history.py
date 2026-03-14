from fastapi import APIRouter, HTTPException, Query, status

from app.models.schemas import (
	ErrorResponse,
	GameHistoryListResponse,
	GameHistorySummary,
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
