import hmac
import secrets

from app.core.config import SettingsFactory

ROOM_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def generate_room_code() -> str:
    try:
        settings = SettingsFactory.get()
        return "".join(
            secrets.choice(ROOM_CODE_CHARS) for ch in range(settings.ROOM_CODE_LENGTH)
        )
    except Exception as e:
        raise RuntimeError(f"Failed to generate room code: {e}") from e


def generate_client_token() -> str:
    try:
        settings = SettingsFactory.get()
        return secrets.token_urlsafe(settings.TOKEN_LENGTH)
    except Exception as e:
        raise RuntimeError(f"Failed to generate client token: {e}") from e


def validate_token(token: str, stored_token: str) -> bool:
    try:
        return hmac.compare_digest(token, stored_token)
    except Exception:
        return False
