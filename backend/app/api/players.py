from fastapi import APIRouter, Header, HTTPException, status

from app.core.db import DatabaseManager
from app.models.schemas import ErrorResponse, PlayerStatsResponse
from app.repositories.players import PlayerRepository

router = APIRouter(prefix="/players", tags=["players"])


@router.get(
	"/me/stats",
	response_model=PlayerStatsResponse,
	status_code=status.HTTP_200_OK,
	responses={404: {"model": ErrorResponse}},
)
async def get_my_stats(
	x_client_id: str = Header(alias="X-Client-Id"),
) -> PlayerStatsResponse:
	try:
		db = DatabaseManager.get_instance()
		async with db.get_session() as session:
			player_repo = PlayerRepository(session)
			profile = await player_repo.get_by_client_id(x_client_id)
			if profile is None:
				raise ValueError("Player profile not found")
			hit_rate = 0.0
			if profile.total_shots > 0:
				hit_rate = round(profile.total_hits / profile.total_shots * 100, 1)
			return PlayerStatsResponse(
				client_id=profile.client_id,
				display_name=profile.display_name,
				wins=profile.wins,
				losses=profile.losses,
				games_played=profile.games_played,
				total_shots=profile.total_shots,
				total_hits=profile.total_hits,
				hit_rate=hit_rate,
				created_at=profile.created_at.isoformat() if profile.created_at else None,
			)
	except ValueError as e:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
		)
