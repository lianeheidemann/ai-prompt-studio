"""
AI Prompt Studio - Aplicação Flask principal.

Responsável apenas pelas rotas HTTP e pela orquestração entre a interface
(templates/static) e o serviço de IA (services/gemini_service.py).

O histórico de conversas é mantido em memória (lista Python) e é reiniciado
sempre que o servidor é reiniciado. Nenhum banco de dados é utilizado.
"""

from datetime import datetime

from flask import Flask, render_template, request, jsonify

from config import Config
from services.gemini_service import (
    CATEGORIES,
    DEFAULT_CATEGORY,
    generate_response,
    GeminiServiceError,
)

app = Flask(__name__)
app.config.from_object(Config)

# Histórico em memória: lista de dicionários com cada interação realizada.
conversation_history: list[dict] = []


def _add_to_history(category: str, prompt: str, answer: str) -> dict:
    """Adiciona uma nova interação ao histórico em memória e a retorna."""
    entry = {
        "id": len(conversation_history) + 1,
        "category": category,
        "category_label": CATEGORIES[category]["label"],
        "prompt": prompt,
        "answer": answer,
        "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
    }
    conversation_history.append(entry)

    # Evita crescimento indefinido do histórico durante a execução.
    if len(conversation_history) > Config.MAX_HISTORY_ITEMS:
        conversation_history.pop(0)

    return entry


@app.route("/")
def index():
    """Renderiza a página principal com as categorias disponíveis."""
    return render_template("index.html", categories=CATEGORIES, default_category=DEFAULT_CATEGORY)


@app.route("/api/generate", methods=["POST"])
def generate():
    """Recebe um prompt + categoria, consulta o Gemini e retorna a resposta."""
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    category = data.get("category") or DEFAULT_CATEGORY

    if not prompt:
        return jsonify({"error": "Digite um prompt antes de enviar."}), 400

    if category not in CATEGORIES:
        return jsonify({"error": "Categoria inválida."}), 400

    try:
        answer = generate_response(prompt=prompt, category=category)
    except GeminiServiceError as exc:
        return jsonify({"error": str(exc)}), 502

    entry = _add_to_history(category, prompt, answer)
    return jsonify(entry), 200


@app.route("/api/history", methods=["GET"])
def get_history():
    """Retorna o histórico de conversas, do mais recente para o mais antigo."""
    return jsonify(list(reversed(conversation_history))), 200


@app.route("/api/history/clear", methods=["POST"])
def clear_history():
    """Limpa o histórico em memória."""
    conversation_history.clear()
    return jsonify({"message": "Histórico limpo com sucesso."}), 200


if __name__ == "__main__":
    app.run(debug=Config.DEBUG, host="0.0.0.0", port=5000)
