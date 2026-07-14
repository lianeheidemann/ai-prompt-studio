# AI Prompt Studio

[![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge\&logo=python\&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask_3.0-181717?style=for-the-badge\&logo=flask\&logoColor=white)](https://flask.palletsprojects.com/)
[![Gemini API](https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge\&logo=googlegemini\&logoColor=white)](https://ai.google.dev/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge\&logo=html5\&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge\&logo=css\&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=181717)](https://developer.mozilla.org/docs/Web/JavaScript)

Um ambiente web leve para tarefas assistidas por inteligência artificial com o Google Gemini. Conta com seis fluxos de trabalho especializados, conversas contextuais e histórico armazenado localmente no navegador.

## Funcionalidades

* **6 fluxos de trabalho especializados**: resumir, traduzir, explicar código, gerar código, melhorar prompts e criar ideias
* **Dois modos de uso**: tarefa única ou conversa contínua com reconhecimento de contexto
* **Histórico privado**: todos os dados são armazenados localmente no navegador, sem armazenamento no servidor
* **Design responsivo**: funciona de forma fluida em computadores e dispositivos móveis
* **Segurança**: Markdown sanitizado, limites de tamanho das requisições e limitação de solicitações por endereço IP

## Início rápido

### Pré-requisitos

* Python 3.10+
* Chave da API do Google Gemini

### Configuração

1. **Clone e configure o projeto**

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # No Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Adicione as variáveis de ambiente**

   ```bash
   # Crie um arquivo .env na raiz do projeto
   GEMINI_API_KEY=sua_chave_da_api
   GEMINI_MODEL=gemini-3.5-flash
   FLASK_DEBUG=False
   ```

3. **Execute a aplicação**

   ```bash
   python app.py
   ```

   Abra `http://127.0.0.1:5000` no navegador.

## Testes

```bash
python -m unittest discover -s tests -v
node --check static/script.js
```

## Tecnologias utilizadas

* **Backend**: Python 3.10+, Flask 3 e Google Gen AI SDK
* **Frontend**: HTML, CSS e JavaScript, sem frameworks
* **Utilitários**: Mistune para Markdown e Bleach para sanitização

## Arquitetura

| Arquivo                      | Finalidade                                        |
| ---------------------------- | ------------------------------------------------- |
| `app.py`                     | Rotas Flask, validação e limitação de requisições |
| `config.py`                  | Configurações baseadas em variáveis de ambiente   |
| `services/gemini_service.py` | Integração com a API do Gemini                    |
| `templates/index.html`       | Interface da aplicação                            |
| `static/`                    | Estilos e lógica executada no navegador           |

## Configuração

As configurações são definidas por variáveis de ambiente no arquivo `config.py`:

| Variável                    | Valor padrão | Finalidade                                               |
| --------------------------- | -----------: | -------------------------------------------------------- |
| `MAX_PROMPT_LENGTH`         |        10000 | Número máximo de caracteres por entrada                  |
| `MAX_CONTEXT_MESSAGES`      |           12 | Quantidade de mensagens mantidas no contexto da conversa |
| `MAX_HISTORY_ITEMS`         |           50 | Limite de itens no histórico do navegador                |
| `RATE_LIMIT_REQUESTS`       |           10 | Número máximo de requisições por intervalo               |
| `RATE_LIMIT_WINDOW_SECONDS` |           60 | Duração do intervalo de limitação, em segundos           |

## Privacidade

* Os prompts e as respostas **nunca são armazenados** no servidor
* Todo o histórico permanece apenas no `localStorage` do navegador
* As requisições são validadas e sanitizadas antes do processamento
* A limitação de requisições ajuda a impedir abusos originados de um único endereço IP

## Licença

MIT
