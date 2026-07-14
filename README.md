# AI Prompt Studio

[English](README.md) · [Português (Brasil)](README.pt-BR.md)

A focused web workspace for common AI-assisted tasks, powered by Google Gemini. It combines specialized workflows, contextual conversations, translation controls, and browser-local history in a lightweight Flask application.

## Highlights

- Six specialized workflows: summarization, translation, code explanation, code generation, prompt improvement, and brainstorming.
- Translation with a browser-language default for the source and English as the default target; both remain editable.
- Single-task and contextual conversation modes.
- Private, browser-local history with individual deletion, full cleanup, and JSON export.
- Sanitized Markdown rendering, request limits, context validation, and per-IP rate limiting.
- Stateless backend: prompts and responses are not stored by Flask.

## Tech stack

Python 3.10+, Flask 3, Google Gen AI SDK, Mistune, Bleach, and framework-free HTML, CSS, and JavaScript.

## Getting started

### 1. Create and activate a virtual environment

```powershell
python -m venv .venv
.venv\Scripts\activate
```

On Linux or macOS:

```bash
python -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 3. Configure Gemini

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-3.5-flash
FLASK_DEBUG=False
```

### 4. Run the application

```bash
python app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000).

## Tests

Tests use mocks and do not call the Gemini API.

```bash
python -m unittest discover -s tests -v
node --check static/script.js
```

## Privacy and limits

Conversation history is stored only in the current browser through `localStorage`. In conversation mode, recent messages are sent with the current request to preserve context and are discarded by the server afterward.

Input, context, request-size, history, and rate-limit settings can be adjusted through environment variables defined in [`config.py`](config.py). The built-in rate limiter is intended for a single application instance.

## Project structure

```text
app.py                      Flask routes, validation, rate limiting, Markdown
config.py                   Environment-based configuration
services/gemini_service.py Gemini integration and specialized instructions
templates/index.html        Application interface
static/                     Browser behavior and responsive styles
tests/                      Backend and AI contract tests
```

## Interface

![AI Prompt Studio interface](assets/interface/interface2.png)
