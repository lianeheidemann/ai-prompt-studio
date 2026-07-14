"""Rotas HTTP stateless do AI Prompt Studio."""

from collections import defaultdict, deque
from datetime import datetime, timezone
import logging
import math
from pathlib import Path
from threading import Lock
import time
from uuid import uuid4

import bleach
from flask import Flask, jsonify, render_template, request, send_from_directory
import mistune

from config import Config
from services.gemini_service import CATEGORIES, DEFAULT_CATEGORY, GeminiServiceError, generate_response

logger = logging.getLogger(__name__)
app = Flask(__name__)
app.config.from_object(Config)

ASSETS_DIRECTORY = Path(app.root_path) / "assets"
MARKDOWN = mistune.create_markdown(escape=True, plugins=["strikethrough", "table"])
ALLOWED_MARKDOWN_TAGS = {
    "a", "blockquote", "br", "code", "del", "em", "h1", "h2", "h3", "h4",
    "h5", "h6", "hr", "li", "ol", "p", "pre", "strong", "table", "tbody",
    "td", "th", "thead", "tr", "ul",
}

_rate_limit_entries: dict[str, deque[float]] = defaultdict(deque)
_rate_limit_lock = Lock()


def _error(message: str, code: str, status: int, **headers):
    response = jsonify({"error": message, "code": code})
    for name, value in headers.items():
        response.headers[name.replace("_", "-")] = str(value)
    return response, status


def _validate_language(value, *, field_name: str, default: str | None = None):
    """Valida nomes curtos de idioma antes de inseri-los na instrução do modelo."""
    if value is None and default is not None:
        value = default
    if not isinstance(value, str) or not value.strip():
        label = "original" if field_name == "source_language" else "de destino"
        return None, _error(
            f"Escolha o idioma {label} da tradução.",
            f"missing_{field_name}",
            400,
        )

    language = " ".join(value.strip().split())
    is_valid_name = (
        2 <= len(language) <= 40
        and all(character.isalpha() or character in {" ", "-"} for character in language)
    )
    if not is_valid_name:
        return None, _error("Escolha um idioma válido.", f"invalid_{field_name}", 400)
    return language, None


def _render_markdown(text: str) -> str:
    """Converte Markdown e remove tags, atributos e protocolos perigosos."""
    rendered = MARKDOWN(text)
    return bleach.clean(
        rendered,
        tags=ALLOWED_MARKDOWN_TAGS,
        attributes={"a": ["href", "title"], "code": ["class"]},
        protocols={"http", "https", "mailto"},
        strip=True,
    )


def _check_rate_limit() -> int | None:
    """Registra a tentativa e retorna Retry-After quando o IP excedeu o limite."""
    limit = max(1, int(app.config["RATE_LIMIT_REQUESTS"]))
    window = max(1, int(app.config["RATE_LIMIT_WINDOW_SECONDS"]))
    client_key = request.remote_addr or "unknown"
    now = time.monotonic()

    with _rate_limit_lock:
        entries = _rate_limit_entries[client_key]
        while entries and entries[0] <= now - window:
            entries.popleft()
        if len(entries) >= limit:
            return max(1, math.ceil(window - (now - entries[0])))
        entries.append(now)
    return None


def _validate_context(raw_context) -> tuple[list[dict[str, str]] | None, tuple | None]:
    if raw_context in (None, []):
        return [], None
    if not isinstance(raw_context, list):
        return None, _error("O contexto da conversa é inválido.", "invalid_context", 400)

    max_messages = max(0, int(app.config["MAX_CONTEXT_MESSAGES"]))
    if len(raw_context) > max_messages:
        return None, _error(
            f"O contexto pode conter no máximo {max_messages} mensagens.",
            "context_too_large",
            400,
        )

    context: list[dict[str, str]] = []
    total_chars = 0
    expected_role = "user"
    for message in raw_context:
        if not isinstance(message, dict):
            return None, _error("Uma mensagem do contexto é inválida.", "invalid_context", 400)
        role = message.get("role")
        text = message.get("text")
        if role != expected_role or not isinstance(text, str) or not text.strip():
            return None, _error(
                "O contexto deve alternar mensagens válidas entre usuário e IA.",
                "invalid_context_sequence",
                400,
            )
        clean_text = text.strip()
        total_chars += len(clean_text)
        context.append({"role": role, "text": clean_text})
        expected_role = "model" if role == "user" else "user"

    if context and context[-1]["role"] != "model":
        return None, _error(
            "O contexto deve terminar com uma resposta da IA.",
            "invalid_context_sequence",
            400,
        )
    if total_chars > int(app.config["MAX_CONTEXT_CHARS"]):
        return None, _error("O contexto da conversa ficou muito grande. Inicie uma nova conversa.", "context_too_large", 400)
    return context, None


@app.get("/")
def index():
    return render_template(
        "index.html",
        categories=CATEGORIES,
        default_category=DEFAULT_CATEGORY,
        max_prompt_length=app.config["MAX_PROMPT_LENGTH"],
        max_history_items=app.config["MAX_HISTORY_ITEMS"],
        max_context_messages=app.config["MAX_CONTEXT_MESSAGES"],
        max_context_chars=app.config["MAX_CONTEXT_CHARS"],
    )


@app.get("/assets/<path:filename>")
def assets(filename: str):
    return send_from_directory(ASSETS_DIRECTORY, filename)


@app.post("/api/generate")
def generate():
    retry_after = _check_rate_limit()
    if retry_after is not None:
        return _error(
            f"Muitas solicitações em pouco tempo. Tente novamente em {retry_after} segundos.",
            "rate_limit_exceeded",
            429,
            Retry_After=retry_after,
        )

    if not request.is_json:
        return _error("Envie os dados no formato JSON.", "invalid_content_type", 415)
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return _error("O corpo da solicitação é inválido.", "invalid_json", 400)

    prompt_value = data.get("prompt")
    if not isinstance(prompt_value, str) or not prompt_value.strip():
        return _error("Digite uma pergunta antes de enviar.", "empty_prompt", 400)
    prompt = prompt_value.strip()
    max_prompt_length = int(app.config["MAX_PROMPT_LENGTH"])
    if len(prompt) > max_prompt_length:
        return _error(
            f"A pergunta ultrapassa o limite de {max_prompt_length} caracteres.",
            "prompt_too_long",
            400,
        )

    category = data.get("category", DEFAULT_CATEGORY)
    if category not in CATEGORIES:
        return _error("Escolha uma categoria válida.", "invalid_category", 400)

    mode = data.get("mode", "task")
    if mode not in {"task", "conversation"}:
        return _error("Escolha um modo de uso válido.", "invalid_mode", 400)

    context: list[dict[str, str]] = []
    if mode == "conversation":
        context, context_error = _validate_context(data.get("context"))
        if context_error:
            return context_error

    source_language = None
    target_language = None
    if category == "traduzir":
        source_language, language_error = _validate_language(
            data.get("source_language"),
            field_name="source_language",
            default="Detectar automaticamente",
        )
        if language_error:
            return language_error
        target_language, language_error = _validate_language(
            data.get("target_language"),
            field_name="target_language",
        )
        if language_error:
            return language_error

    try:
        answer = generate_response(
            prompt=prompt,
            category=category,
            context=context,
            source_language=source_language,
            target_language=target_language,
        )
    except GeminiServiceError as exc:
        return _error(exc.public_message, exc.code, exc.status_code)
    except Exception:
        logger.exception("Erro inesperado ao gerar resposta")
        return _error("Ocorreu um erro inesperado. Tente novamente.", "internal_error", 500)

    return jsonify({
        "id": str(uuid4()),
        "category": category,
        "category_label": CATEGORIES[category]["label"],
        "mode": mode,
        "source_language": source_language,
        "target_language": target_language,
        "prompt": prompt,
        "answer": answer,
        "answer_html": _render_markdown(answer),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }), 200


@app.errorhandler(413)
def request_too_large(_error_details):
    return _error("A solicitação é grande demais para ser processada.", "request_too_large", 413)


if __name__ == "__main__":
    app.run(debug=Config.DEBUG, host="0.0.0.0", port=5000)
