<div align="center">
  <img width="110" alt="AI Prompt Studio animated logo" src="./assets/icon/logo-robo-animada.svg?v=1">

  <h1>
    AI Prompt Studio
    <img alt="Status: in development" src="https://img.shields.io/badge/status-in%20development-6366f1?style=flat-square&amp;logo=git&amp;logoColor=white">
  </h1>

  <p>
    <a href="https://www.python.org/"><img alt="Python" src="https://img.shields.io/badge/Python-0D1117?style=for-the-badge&amp;logo=python&amp;logoColor=3776AB"></a>
    <a href="https://flask.palletsprojects.com/"><img alt="Flask" src="https://img.shields.io/badge/Flask-0D1117?style=for-the-badge&amp;logo=flask&amp;logoColor=white"></a>
    <a href="https://ai.google.dev/"><img alt="Gemini API" src="https://img.shields.io/badge/Gemini_API-0D1117?style=for-the-badge&amp;logo=googlegemini&amp;logoColor=8E75B2"></a>
    <a href="https://developer.mozilla.org/docs/Web/HTML"><img alt="HTML5" src="https://img.shields.io/badge/HTML5-0D1117?style=for-the-badge&amp;logo=html5&amp;logoColor=E34F26"></a>
    <a href="https://developer.mozilla.org/docs/Web/CSS"><img alt="CSS3" src="https://img.shields.io/badge/CSS3-0D1117?style=for-the-badge&amp;logo=css3&amp;logoColor=1572B6"></a>
    <a href="https://developer.mozilla.org/docs/Web/JavaScript"><img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-0D1117?style=for-the-badge&amp;logo=javascript&amp;logoColor=F7DF1E"></a>
  </p>
</div>

**Live demo:** [ai-prompt-studio-av25.onrender.com](https://ai-prompt-studio-av25.onrender.com)



A lightweight web workspace for AI-assisted tasks with Google Gemini. Features six specialized workflows, contextual conversations, and browser-local history.

> **Note:** the UI and all messages are currently Portuguese (pt-BR) only, with no language toggle.

## Features

- **6 specialized workflows**: Summarize, translate, explain code, generate code, improve prompts, and brainstorm
- **Dual modes**: Single-task or continuous conversation with context awareness
- **Private history**: All data stored locally in the browser (no server storage)
- **Responsive design**: Works seamlessly on desktop and mobile
- **Security**: Sanitized Markdown, request limits, rate limiting per IP

## Quick Start

### Prerequisites

- Python 3.10+
- Google Gemini API key

### Setup

1. **Clone and configure**

   ```bash
   git clone https://github.com/lianeheidemann/ai-prompt-studio.git
   cd ai-prompt-studio
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Add environment variables**

   ```bash
   # Create .env file in project root
   GEMINI_API_KEY=your_api_key
   GEMINI_MODEL=gemini-3.5-flash
   ```

3. **Run**

   ```bash
   python app.py
   ```

   Open http://127.0.0.1:5000

## Deploy on Render

The included `render.yaml` can create the service directly on Render:

1. Open the [Render Dashboard](https://dashboard.render.com/) and choose **New > Blueprint**.
2. Connect this repository and confirm the detected configuration.
3. Enter `GEMINI_API_KEY` when prompted. It is a secret and must not be committed to the repository.
4. Finish creating the service and wait for its public `onrender.com` URL.

Every push to the connected branch automatically triggers a new deployment.

## Testing

```bash
python -m unittest discover -s tests -v
node --check static/script.js
node --check static/conversationContext.js
node --test tests/*.mjs
```

### Measuring conversation token usage

`scripts/measure_conversation_tokens.py` measures real token counts for the
"Continuous conversation" mode at a few conversation lengths, using
`client.models.count_tokens` (no content is generated, so it's cheap, but it
still requires a valid `GEMINI_API_KEY` and makes real API calls — it is not
part of the automated test suite):

```bash
python scripts/measure_conversation_tokens.py
```

## Tech Stack

- **Backend**: Python 3.10+, Flask 3, Google Gen AI SDK
- **Frontend**: HTML, CSS, JavaScript (no frameworks)
- **Utilities**: Mistune (Markdown), Bleach (sanitization)

## Architecture

| File | Purpose |
|------|---------|
| `app.py` | Flask routes, validation, rate limiting |
| `config.py` | Environment-based configuration |
| `services/gemini_service.py` | Gemini API integration |
| `templates/index.html` | UI interface |
| `static/` | Styles and client-side logic |

## Configuration

Settings via environment variables in `config.py`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `MAX_PROMPT_LENGTH` | 10000 | Max input characters |
| `MAX_CONTEXT_MESSAGES` | 12 | Conversation history size |
| `MAX_CONTEXT_CHARS` | 30000 | Max characters of conversation context sent to the model |
| `MAX_REQUEST_BYTES` | 65536 | Max request body size accepted by Flask |
| `MAX_HISTORY_ITEMS` | 50 | Browser history limit |
| `RATE_LIMIT_REQUESTS` | 10 | Requests per window |
| `RATE_LIMIT_WINDOW_SECONDS` | 60 | Rate limit window |

## Privacy

- Prompts and responses are **never stored** on the server
- All history persists only in browser `localStorage`
- Requests are validated and sanitized before processing
- Rate limiting prevents abuse from single IP addresses

## Interface

#### Desktop 

<img alt="" src="./assets/interface/demonstration-desktop.gif?v=2">

#### Mobile

<img width="40%" alt="" src="./assets/interface/demonstration-mobile.gif?v=2">

---

<p align="center">Developed by <strong>Liane Heidemann</strong></p>
