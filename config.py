"""
Configurações da aplicação.

Centraliza a leitura de variáveis de ambiente (.env) para que o resto do
código nunca acesse `os.getenv` diretamente. Isso facilita testes e evita
espalhar strings de configuração pelo projeto.
"""

import os
from dotenv import load_dotenv

# Carrega o arquivo .env (se existir) para as variáveis de ambiente do processo.
load_dotenv()


class Config:
    """Configurações centrais do AI Prompt Studio."""

    # Chave de API do Google Gemini (obrigatória para o app funcionar).
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Modelo do Gemini utilizado nas requisições.
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    # Configurações do Flask.
    SECRET_KEY: str = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")
    DEBUG: bool = os.getenv("FLASK_DEBUG", "True").lower() == "true"

    # Quantidade máxima de itens mantidos no histórico em memória.
    MAX_HISTORY_ITEMS: int = int(os.getenv("MAX_HISTORY_ITEMS", "50"))
