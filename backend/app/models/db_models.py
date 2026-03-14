import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
	pass


def generate_uuid() -> str:
	return str(uuid.uuid4())


def utc_now() -> datetime:
	return datetime.now(timezone.utc)


class GameRoom(Base):
	__tablename__ = "game_rooms"

	id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
	room_code: Mapped[str] = mapped_column(String(6), unique=True, index=True)
	mode: Mapped[str] = mapped_column(String(10))
	status: Mapped[str] = mapped_column(String(20), default="waiting")
	created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime, default=utc_now, onupdate=utc_now
	)
	winner_player_id: Mapped[str | None] = mapped_column(String, nullable=True)

	players: Mapped[list["PlayerSession"]] = relationship(
		"PlayerSession", back_populates="room", lazy="selectin"
	)
	snapshot: Mapped["GameSnapshot | None"] = relationship(
		"GameSnapshot", back_populates="room", uselist=False, lazy="selectin"
	)
	moves: Mapped[list["MoveHistory"]] = relationship(
		"MoveHistory", back_populates="room", lazy="selectin"
	)


class PlayerSession(Base):
	__tablename__ = "player_sessions"

	id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
	room_id: Mapped[str] = mapped_column(String, ForeignKey("game_rooms.id"))
	player_slot: Mapped[str] = mapped_column(String(10))
	display_name: Mapped[str] = mapped_column(String(50), default="Player")
	client_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
	connected: Mapped[bool] = mapped_column(Boolean, default=False)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime, default=utc_now, onupdate=utc_now
	)

	room: Mapped["GameRoom"] = relationship("GameRoom", back_populates="players")


class GameSnapshot(Base):
	__tablename__ = "game_snapshots"

	id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
	room_id: Mapped[str] = mapped_column(
		String, ForeignKey("game_rooms.id"), unique=True
	)
	current_turn: Mapped[str | None] = mapped_column(String, nullable=True)
	player1_board: Mapped[dict] = mapped_column(JSON, default=dict)
	player2_board: Mapped[dict] = mapped_column(JSON, default=dict)
	player1_placed: Mapped[bool] = mapped_column(Boolean, default=False)
	player2_placed: Mapped[bool] = mapped_column(Boolean, default=False)
	player1_shots: Mapped[list] = mapped_column(JSON, default=list)
	player2_shots: Mapped[list] = mapped_column(JSON, default=list)
	player1_ships_remaining: Mapped[int] = mapped_column(Integer, default=5)
	player2_ships_remaining: Mapped[int] = mapped_column(Integer, default=5)
	turn_number: Mapped[int] = mapped_column(Integer, default=0)
	game_status: Mapped[str] = mapped_column(String(20), default="setup")
	difficulty: Mapped[str | None] = mapped_column(String(10), nullable=True)
	ai_strategy_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)

	room: Mapped["GameRoom"] = relationship("GameRoom", back_populates="snapshot")


class MoveHistory(Base):
	__tablename__ = "move_history"

	id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
	room_id: Mapped[str] = mapped_column(
		String, ForeignKey("game_rooms.id"), index=True
	)
	turn_number: Mapped[int] = mapped_column(Integer)
	actor_player_id: Mapped[str] = mapped_column(String)
	coordinate: Mapped[str] = mapped_column(String(3))
	result: Mapped[str] = mapped_column(String(10))
	sunk_ship: Mapped[str | None] = mapped_column(String(20), nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

	room: Mapped["GameRoom"] = relationship("GameRoom", back_populates="moves")
