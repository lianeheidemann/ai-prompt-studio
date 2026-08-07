"""Mede o consumo real de tokens do modo "Conversa Contínua" (issue #4).

Ferramenta manual, fora da suíte automatizada: faz chamadas reais à API do
Gemini (via client.models.count_tokens, sem gerar conteúdo) e por isso exige
uma GEMINI_API_KEY válida. Não é executada pelo CI.

Uso:
    python scripts/measure_conversation_tokens.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google.genai import types

from config import Config
from services.gemini_service import CATEGORIES, DEFAULT_CATEGORY, _get_client

# Cenários sintéticos: quantidade de turnos (par pergunta/resposta) simulados,
# aproximando o tamanho de mensagens reais de uso do app.
SCENARIOS = [
    ("Conversa curta", 2),
    ("Conversa média", 6),
    ("Conversa longa (próxima do limite de mensagens)", Config.MAX_CONTEXT_MESSAGES // 2),
]

SAMPLE_USER_TURN = (
    "Pode me explicar com mais detalhes essa parte e sugerir um próximo passo?"
)
SAMPLE_MODEL_TURN = (
    "Claro. Aqui está uma explicação mais detalhada, com um exemplo prático e "
    "uma sugestão concreta de próximo passo para você avaliar."
)


def build_contents(turns: int) -> list[types.Content]:
    contents = []
    for _ in range(turns):
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=SAMPLE_USER_TURN)]))
        contents.append(types.Content(role="model", parts=[types.Part.from_text(text=SAMPLE_MODEL_TURN)]))
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=SAMPLE_USER_TURN)]))
    return contents


def main() -> None:
    client = _get_client()
    instruction = CATEGORIES[DEFAULT_CATEGORY]["instruction"]

    print(f"{'Cenário':<45} {'Turnos':>7} {'Caracteres':>11} {'Tokens':>8}")
    print("-" * 75)
    for label, turns in SCENARIOS:
        contents = build_contents(turns)
        total_chars = sum(len(part.text) for content in contents for part in content.parts)
        result = client.models.count_tokens(
            model=Config.GEMINI_MODEL,
            contents=contents,
            config=types.CountTokensConfig(system_instruction=instruction),
        )
        print(f"{label:<45} {turns:>7} {total_chars:>11} {result.total_tokens:>8}")

    print(
        "\nLimites atuais: "
        f"MAX_CONTEXT_MESSAGES={Config.MAX_CONTEXT_MESSAGES}, "
        f"MAX_CONTEXT_CHARS={Config.MAX_CONTEXT_CHARS}."
    )


if __name__ == "__main__":
    main()
