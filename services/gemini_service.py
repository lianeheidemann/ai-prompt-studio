"""Integração stateless com a API do Google Gemini."""

from functools import lru_cache
import logging

from google import genai
from google.genai import types

from config import Config

logger = logging.getLogger(__name__)

CATEGORIES = {
    "resumir": {
        "label": "Resumir texto",
        "icon": "summarize",
        "temperature": 0.3,
        "instruction": (
            "Você é um assistente especializado em resumir textos. Produza um "
            "resumo claro, objetivo e bem estruturado, preservando as informações "
            "essenciais e removendo detalhes redundantes."
        ),
    },
    "traduzir": {
        "label": "Traduzir",
        "icon": "translate",
        "temperature": 0.2,
        "instruction": (
            "Você é um assistente especializado em tradução. Identifique o idioma "
            "de origem e, se o usuário não indicar o destino, traduza para o inglês. "
            "Preserve o sentido, o tom, a formatação e o contexto original."
        ),
    },
    "explicar_codigo": {
        "label": "Explicar código",
        "icon": "code",
        "temperature": 0.4,
        "instruction": (
            "Você é um engenheiro de software sênior especializado em explicar "
            "código de forma didática. Descreva o funcionamento e destaque riscos, "
            "pontos de atenção e melhorias com linguagem clara."
        ),
    },
    "gerar_codigo": {
        "label": "Gerar código",
        "icon": "terminal",
        "temperature": 0.4,
        "instruction": (
            "Você é um engenheiro de software sênior. Gere código limpo, funcional "
            "e seguro, seguindo boas práticas. Declare suposições importantes e "
            "explique brevemente a solução."
        ),
    },
    "melhorar_prompt": {
        "label": "Melhorar prompt",
        "icon": "auto_awesome",
        "temperature": 0.6,
        "instruction": (
            "Você é especialista em Prompt Engineering. Reescreva o prompt para "
            "torná-lo claro, específico e eficaz. Apresente o prompt melhorado e "
            "explique brevemente as principais mudanças."
        ),
    },
    "brainstorm": {
        "label": "Brainstorm",
        "icon": "lightbulb",
        "temperature": 0.9,
        "instruction": (
            "Você é um facilitador criativo. Gere ideias variadas e originais, "
            "organizadas em tópicos e agrupadas por abordagem quando fizer sentido."
        ),
    },
}

DEFAULT_CATEGORY = "resumir"
CONVERSATION_INSTRUCTION = (
    "No modo de conversa, considere as mensagens anteriores fornecidas e mantenha "
    "continuidade. Não afirme lembrar de informações que não estejam no contexto."
)


class GeminiServiceError(Exception):
    """Falha da integração com uma mensagem segura para o usuário."""

    def __init__(self, message: str, *, code: str = "ai_error", status_code: int = 502):
        super().__init__(message)
        self.public_message = message
        self.code = code
        self.status_code = status_code


@lru_cache(maxsize=1)
def _get_client() -> genai.Client:
    if not Config.GEMINI_API_KEY:
        raise GeminiServiceError(
            "O serviço de IA ainda não foi configurado. Contate o administrador.",
            code="ai_not_configured",
            status_code=503,
        )
    return genai.Client(api_key=Config.GEMINI_API_KEY)


def _to_content(message: dict[str, str]) -> types.Content:
    return types.Content(
        role=message["role"],
        parts=[types.Part.from_text(text=message["text"])],
    )


def _classify_api_error(exc: Exception) -> GeminiServiceError:
    details = f"{type(exc).__name__}: {exc}".lower()

    if any(term in details for term in ("429", "quota", "resourceexhausted", "rate limit")):
        return GeminiServiceError(
            "O limite temporário do serviço de IA foi atingido. Tente novamente em alguns instantes.",
            code="ai_quota_exceeded",
            status_code=503,
        )
    if any(term in details for term in ("401", "403", "api key", "permissiondenied", "unauthenticated")):
        return GeminiServiceError(
            "O serviço de IA está indisponível por um problema de configuração.",
            code="ai_authentication_error",
            status_code=503,
        )
    if any(term in details for term in ("timeout", "timed out", "503", "unavailable")):
        return GeminiServiceError(
            "O serviço de IA está temporariamente indisponível. Tente novamente.",
            code="ai_temporarily_unavailable",
            status_code=503,
        )
    return GeminiServiceError(
        "Não foi possível gerar uma resposta agora. Tente novamente.",
        code="ai_request_failed",
        status_code=502,
    )


def generate_response(
    prompt: str,
    category: str,
    context: list[dict[str, str]] | None = None,
) -> str:
    """Gera uma resposta sem persistir prompt, resposta ou contexto no servidor."""
    metadata = CATEGORIES.get(category)
    if metadata is None:
        raise GeminiServiceError("A categoria informada é inválida.", code="invalid_category", status_code=400)

    context = context or []
    contents: str | list[types.Content]
    if context:
        contents = [_to_content(message) for message in context]
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=prompt)]))
        system_instruction = f"{metadata['instruction']}\n\n{CONVERSATION_INSTRUCTION}"
    else:
        contents = prompt
        system_instruction = metadata["instruction"]

    try:
        response = _get_client().models.generate_content(
            model=Config.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=metadata["temperature"],
            ),
        )
    except GeminiServiceError:
        raise
    except Exception as exc:
        logger.exception("Falha ao consultar a API do Gemini")
        raise _classify_api_error(exc) from exc

    answer = getattr(response, "text", None)
    if not answer or not answer.strip():
        raise GeminiServiceError(
            "A IA não retornou conteúdo. Reformule a pergunta e tente novamente.",
            code="ai_empty_response",
            status_code=502,
        )
    return answer.strip()
