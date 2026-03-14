from fastapi import APIRouter, HTTPException, Header, status

from app.core.websocket_manager import ConnectionManager
from app.models.schemas import (
	CreateRoomRequest,
	CreateRoomResponse,
	ErrorResponse,
	JoinRoomRequest,
	JoinRoomResponse,
	ReconnectResponse,
	PlayerInfo,
)
from app.services.room_service import RoomService

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post(
	"",
	response_model=CreateRoomResponse,
	status_code=status.HTTP_201_CREATED,
	responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def create_room(
	request: CreateRoomRequest = CreateRoomRequest(),
) -> CreateRoomResponse:
	try:
		service = RoomService.get_instance()
		result = await service.create_room(
			mode=request.mode,
			display_name=request.display_name,
			difficulty=request.difficulty,
			client_id=request.client_id,
			board_size=request.board_size,
		)
		return CreateRoomResponse(**result)
	except ValueError as e:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
		)


@router.post(
	"/join",
	response_model=JoinRoomResponse,
	status_code=status.HTTP_200_OK,
	responses={
		400: {"model": ErrorResponse},
		404: {"model": ErrorResponse},
	},
)
async def join_room(request: JoinRoomRequest) -> JoinRoomResponse:
	try:
		service = RoomService.get_instance()
		result = await service.join_room(
			room_code=request.room_code,
			display_name=request.display_name,
			client_id=request.client_id,
		)

		manager = ConnectionManager.get_instance()
		await manager.broadcast_to_room(
			result["room_id"],
			{
				"type": "room.player_joined",
				"data": {
					"player_slot": result["player_slot"],
					"player_id": result["player_id"],
				},
			},
		)

		return JoinRoomResponse(**result)
	except ValueError as e:
		error_msg = str(e)
		if "not found" in error_msg:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg)
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
		)


@router.post(
	"/reconnect",
	response_model=ReconnectResponse,
	status_code=status.HTTP_200_OK,
	responses={
		404: {"model": ErrorResponse},
	},
)
async def reconnect(
	x_client_id: str = Header(alias="X-Client-Id"),
) -> ReconnectResponse:
	try:
		service = RoomService.get_instance()
		result = await service.reconnect(x_client_id)
		return ReconnectResponse(
			room_id=result["room_id"],
			room_code=result["room_code"],
			player_id=result["player_id"],
			player_slot=result["player_slot"],
			client_token=result["client_token"],
			room_status=result["room_status"],
			mode=result["mode"],
			players=[PlayerInfo(**p) for p in result["players"]],
		)
	except ValueError as e:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
		)
