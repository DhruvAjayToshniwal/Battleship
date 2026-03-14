from pydantic_settings import BaseSettings


class Settings(BaseSettings):
	model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

	DATABASE_URL: str = "sqlite+aiosqlite:///./battleship.db"
	CORS_ORIGINS: str = "http://localhost:5173"
	ROOM_CODE_LENGTH: int = 6
	TOKEN_LENGTH: int = 32
	WS_HEARTBEAT_INTERVAL: int = 30


class SettingsFactory:
	instance: Settings | None = None

	@classmethod
	def get(cls) -> Settings:
		try:
			if cls.instance is None:
				cls.instance = Settings()
			return cls.instance
		except Exception as e:
			raise RuntimeError(f"Failed to load settings: {e}") from e

	@classmethod
	def reset(cls) -> None:
		cls.instance = None
