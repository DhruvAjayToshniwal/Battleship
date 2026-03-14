from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import SettingsFactory


class DatabaseManager:
	instance: "DatabaseManager | None" = None
	engine = None
	session_factory = None

	def __new__(cls) -> "DatabaseManager":
		if cls.instance is None:
			cls.instance = super().__new__(cls)
		return cls.instance

	@classmethod
	def get_instance(cls) -> "DatabaseManager":
		try:
			if cls.instance is None:
				cls.instance = cls()
				settings = SettingsFactory.get()
				cls.instance.engine = create_async_engine(
					settings.DATABASE_URL,
					echo=False,
					connect_args={"check_same_thread": False}
					if "sqlite" in settings.DATABASE_URL
					else {},
				)
				cls.instance.session_factory = async_sessionmaker(
					cls.instance.engine, class_=AsyncSession, expire_on_commit=False
				)
			return cls.instance
		except Exception as e:
			raise RuntimeError(f"Failed to initialize database: {e}") from e

	def get_session(self) -> AsyncSession:
		try:
			return self.session_factory()
		except Exception as e:
			raise RuntimeError(f"Failed to create database session: {e}") from e

	async def init_db(self) -> None:
		try:
			from app.models.db_models import Base

			async with self.engine.begin() as conn:
				await conn.run_sync(Base.metadata.create_all)
		except Exception as e:
			raise RuntimeError(f"Failed to initialize database tables: {e}") from e

	@classmethod
	async def reset(cls) -> None:
		try:
			if cls.instance and cls.instance.engine:
				await cls.instance.engine.dispose()
			cls.instance = None
		except Exception as e:
			raise RuntimeError(f"Failed to reset database: {e}") from e
