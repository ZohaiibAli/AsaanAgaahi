"""Central settings object. Everything is read from backend/.env (python-dotenv),
never hard-coded, so the same code runs for every teammate with their own .env."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    mongo_uri: str
    db_name: str = "practice_mode"

    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080

    frontend_origin: str = "http://localhost:8081"

    llm_provider: str = "gemini"
    mock_llm: bool = False
    llm_timeout_seconds: int = 8
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-5-5"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    otp_provider: str = "mock"
    otp_expire_seconds: int = 300

    host: str = "0.0.0.0"
    port: int = 8000


settings = Settings()
