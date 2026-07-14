# AI Prompt Studio

[![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask_3.0-181717?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Gemini API](https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=181717)](https://developer.mozilla.org/docs/Web/JavaScript)

A lightweight web workspace for AI-assisted tasks with Google Gemini. Features six specialized workflows, contextual conversations, and browser-local history.

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
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Add environment variables**
   ```bash
   # Create .env file in project root
   GEMINI_API_KEY=your_api_key
   GEMINI_MODEL=gemini-3.5-flash
   FLASK_DEBUG=False
   ```

3. **Run**
   ```bash
   python app.py
   ```
   Open http://127.0.0.1:5000

## Testing

```bash
python -m unittest discover -s tests -v
node --check static/script.js
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
| `MAX_HISTORY_ITEMS` | 50 | Browser history limit |
| `RATE_LIMIT_REQUESTS` | 10 | Requests per window |
| `RATE_LIMIT_WINDOW_SECONDS` | 60 | Rate limit window |

## Privacy

- Prompts and responses are **never stored** on the server
- All history persists only in browser `localStorage`
- Requests are validated and sanitized before processing
- Rate limiting prevents abuse from single IP addresses

## License

MIT
