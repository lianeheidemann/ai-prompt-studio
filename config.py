"""Configurações centrais do AI Prompt Studio."""

import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    """Configurações carregadas do ambiente."""

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    SECRET_KEY: str = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")
    DEBUG: bool = os.getenv("FLASK_DEBUG", "True").lower() == "true"

    # Limites de entrada e de contexto enviados ao modelo.
    MAX_PROMPT_LENGTH: int = int(os.getenv("MAX_PROMPT_LENGTH", "10000"))
    MAX_CONTEXT_MESSAGES: int = int(os.getenv("MAX_CONTEXT_MESSAGES", "12"))
    MAX_CONTEXT_CHARS: int = int(os.getenv("MAX_CONTEXT_CHARS", "30000"))
    MAX_CONTENT_LENGTH: int = int(os.getenv("MAX_REQUEST_BYTES", "65536"))

    # Limite simples por IP. Para múltiplas instâncias, substitua por Redis.
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "10"))
    RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

    # Quantidade de registros preservados no localStorage do navegador.
    MAX_HISTORY_ITEMS: int = int(os.getenv("MAX_HISTORY_ITEMS", "50"))
