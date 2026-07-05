"""
Serviço de integração com a API do Google Gemini.

Este módulo isola toda a lógica de IA (categorias, prompts de sistema e
chamadas à API) das rotas Flask, seguindo o princípio de separação entre
interface e lógica de negócio.
"""

from google import genai
from google.genai import types

from config import Config


# Metadados de cada categoria suportada pela aplicação:
# - label: nome exibido na interface
# - icon: ícone (Material Symbols) exibido no card/chip
# - instruction: instrução de sistema enviada ao modelo para guiar a resposta
CATEGORIES = {
    "resumir": {
        "label": "Resumir texto",
        "icon": "summarize",
        "instruction": (
            "Você é um assistente especializado em resumir textos. Leia o "
            "conteúdo enviado pelo usuário e produza um resumo claro, "
            "objetivo e bem estruturado, preservando as informações "
            "essenciais e removendo detalhes redundantes."
        ),
    },
    "traduzir": {
        "label": "Traduzir",
        "icon": "translate",
        "instruction": (
            "Você é um assistente especializado em tradução. Identifique o "
            "idioma de origem e, caso o usuário não indique o idioma de "
            "destino, traduza para o inglês. Preserve o sentido, o tom e o "
            "contexto original do texto."
        ),
    },
    "explicar_codigo": {
        "label": "Explicar código",
        "icon": "code",
        "instruction": (
            "Você é um engenheiro de software sênior especializado em "
            "explicar código de forma didática. Descreva o que o código "
            "faz, como funciona passo a passo e destaque possíveis pontos "
            "de atenção, riscos ou melhorias, usando linguagem clara."
        ),
    },
    "gerar_codigo": {
        "label": "Gerar código",
        "icon": "terminal",
        "instruction": (
            "Você é um engenheiro de software sênior. Gere código limpo, "
            "funcional e comentado a partir da solicitação do usuário, "
            "seguindo boas práticas de programação. Ao final, explique "
            "brevemente a solução proposta."
        ),
    },
    "melhorar_prompt": {
        "label": "Melhorar prompt",
        "icon": "auto_awesome",
        "instruction": (
            "Você é um especialista em Prompt Engineering. Reescreva o "
            "prompt enviado pelo usuário para torná-lo mais claro, "
            "específico e eficaz para uso com modelos de IA generativa. "
            "Apresente o prompt melhorado e, em seguida, explique "
            "brevemente as melhorias aplicadas."
        ),
    },
    "brainstorm": {
        "label": "Brainstorm",
        "icon": "lightbulb",
        "instruction": (
            "Você é um facilitador criativo de brainstorming. A partir do "
            "tema fornecido, gere uma lista variada de ideias originais, "
            "organizadas em tópicos e agrupadas por abordagem quando fizer "
            "sentido."
        ),
    },
}

DEFAULT_CATEGORY = "resumir"


class GeminiServiceError(Exception):
    """Erro genérico ao comunicar com a API do Gemini."""


def _get_client() -> genai.Client:
    """Cria um client autenticado da API do Gemini."""
    if not Config.GEMINI_API_KEY:
        raise GeminiServiceError(
            "GEMINI_API_KEY não configurada. Defina a variável de ambiente "
            "no arquivo .env antes de iniciar a aplicação."
        )
    return genai.Client(api_key=Config.GEMINI_API_KEY)


def _system_instruction_for(category: str) -> str:
    """Retorna a instrução de sistema associada à categoria informada."""
    metadata = CATEGORIES.get(category, CATEGORIES[DEFAULT_CATEGORY])
    return metadata["instruction"]


def generate_response(prompt: str, category: str) -> str:
    """
    Envia o prompt do usuário para a API do Gemini, aplicando o contexto
    adequado à categoria escolhida.

    Args:
        prompt: Texto digitado pelo usuário.
        category: Uma das chaves definidas em CATEGORIES.

    Returns:
        Texto de resposta gerado pelo modelo.

    Raises:
        GeminiServiceError: Se o prompt for inválido ou a chamada à API falhar.
    """
    if not prompt or not prompt.strip():
        raise GeminiServiceError("O prompt não pode estar vazio.")

    client = _get_client()
    system_instruction = _system_instruction_for(category)

    try:
        response = client.models.generate_content(
            model=Config.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            ),
        )
    except Exception as exc:
        # Qualquer falha de rede, autenticação ou da própria API é
        # convertida em um erro de domínio da aplicação.
        raise GeminiServiceError(f"Erro ao chamar a API do Gemini: {exc}") from exc

    answer = getattr(response, "text", None)
    if not answer:
        raise GeminiServiceError("A API do Gemini não retornou nenhum conteúdo.")

    return answer.strip()
