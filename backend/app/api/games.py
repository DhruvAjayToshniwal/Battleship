from fastapi import APIRouter, HTTPException, Header, status

from app.core.db import DatabaseManager
from app.core.websocket_manager import ConnectionManager
from app.models.schemas import (
    ErrorResponse,
    FireAuthRequest,
    GameStateResponse,
    PlaceShipsAuthRequest,
    PlacementResponse,
    MultiplayerShotResponse,
    ShotResult,
    TurnResult,
)
from app.repositories.rooms import RoomRepository
from app.services.ai_game_service import AIGameService
from app.services.game_service import GameService

router = APIRouter(tags=["games"])


@router.post(
    "/rooms/{room_id}/place-ships",
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def place_ships(room_id: str, request: PlaceShipsAuthRequest) -> dict:
    try:
        db = DatabaseManager.get_instance()
        async with db.get_session() as session:
            room_repo = RoomRepository(session)
            player = await room_repo.get_player_by_token(request.client_token)
            if player is None:
                raise ValueError("Unauthorized")
            room = await room_repo.get_by_id(room_id)
            if room is None:
                raise ValueError("Room not found")
            mode = room.mode

        ships = [
            {"name": s.name, "coordinates": s.coordinates} for s in request.ships
        ]

        if mode == "ai":
            service = AIGameService.get_instance()
            result = await service.place_ships(
                room_id, request.client_token, ships
            )
            return result
        else:
            service = GameService.get_instance()
            result = await service.place_ships(
                room_id, request.client_token, ships
            )

            manager = ConnectionManager.get_instance()
            await manager.broadcast_to_room(
                room_id,
                {
                    "type": "game.placement_ready",
                    "data": {"player_slot": result["player_slot"]},
                },
            )

            if result.get("placement_complete"):
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "game.started",
                        "data": {"game_status": result["game_status"]},
                    },
                )

            return result
    except ValueError as e:
        error_msg = str(e)
        if "Unauthorized" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=error_msg
            )
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=error_msg
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post(
    "/rooms/{room_id}/fire",
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def fire(room_id: str, request: FireAuthRequest) -> dict:
    try:
        db = DatabaseManager.get_instance()
        async with db.get_session() as session:
            room_repo = RoomRepository(session)
            player = await room_repo.get_player_by_token(request.client_token)
            if player is None:
                raise ValueError("Unauthorized")
            room = await room_repo.get_by_id(room_id)
            if room is None:
                raise ValueError("Room not found")
            mode = room.mode

        if mode == "ai":
            service = AIGameService.get_instance()
            result = await service.fire(
                room_id, request.client_token, request.coordinate
            )
            return result
        else:
            service = GameService.get_instance()
            result = await service.fire(
                room_id, request.client_token, request.coordinate
            )

            manager = ConnectionManager.get_instance()
            await manager.broadcast_to_room(
                room_id,
                {"type": "game.move", "data": result},
            )

            if result.get("game_status") in ("player_wins", "ai_wins"):
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "game.finished",
                        "data": {
                            "winner": result.get("actor_player_id"),
                            "game_status": result.get("game_status"),
                        },
                    },
                )

            return result
    except ValueError as e:
        error_msg = str(e)
        if "Unauthorized" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=error_msg
            )
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=error_msg
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get(
    "/rooms/{room_id}/state",
    status_code=status.HTTP_200_OK,
    responses={
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def get_state(
    room_id: str, x_client_token: str = Header(alias="X-Client-Token")
) -> dict:
    try:
        db = DatabaseManager.get_instance()
        async with db.get_session() as session:
            room_repo = RoomRepository(session)
            player = await room_repo.get_player_by_token(x_client_token)
            if player is None:
                raise ValueError("Unauthorized")
            room = await room_repo.get_by_id(room_id)
            if room is None:
                raise ValueError("Room not found")
            mode = room.mode

        if mode == "ai":
            service = AIGameService.get_instance()
            return await service.get_state(room_id, x_client_token)
        else:
            service = GameService.get_instance()
            return await service.get_state(room_id, x_client_token)
    except ValueError as e:
        error_msg = str(e)
        if "Unauthorized" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=error_msg
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=error_msg
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
