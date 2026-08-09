<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/icon/logo.png?v=1">
  <source media="(prefers-color-scheme: light)" srcset="./assets/icon/logo_2.png?v=1">
  <img width="110" alt="" src="./assets/icon/logo.png?v=1">
</picture>

# AI Prompt Studio

[![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge\&logo=python\&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask_3.0-181717?style=for-the-badge\&logo=flask\&logoColor=white)](https://flask.palletsprojects.com/)
[![Gemini API](https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge\&logo=googlegemini\&logoColor=white)](https://ai.google.dev/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge\&logo=html5\&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge\&logo=css\&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=181717)](https://developer.mozilla.org/docs/Web/JavaScript)

**Demonstração:** [ai-prompt-studio-av25.onrender.com](https://ai-prompt-studio-av25.onrender.com)

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
   git clone https://github.com/lianeheidemann/ai-prompt-studio.git
   cd ai-prompt-studio
   python -m venv .venv
   source .venv/bin/activate  # No Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Adicione as variáveis de ambiente**

   ```bash
   # Crie um arquivo .env na raiz do projeto
   GEMINI_API_KEY=sua_chave_da_api
   GEMINI_MODEL=gemini-3.5-flash
   ```

3. **Execute a aplicação**

   ```bash
   python app.py
   ```

   Abra `http://127.0.0.1:5000` no navegador.

## Publicação no Render

O arquivo `render.yaml` permite criar o serviço diretamente no Render:

1. Acesse o [Render Dashboard](https://dashboard.render.com/) e escolha **New > Blueprint**.
2. Conecte este repositório e confirme a configuração encontrada.
3. Informe `GEMINI_API_KEY` quando solicitado. O valor é secreto e não deve ser salvo no repositório.
4. Conclua a criação e aguarde o endereço público `onrender.com`.

Cada novo push para a branch conectada inicia uma nova publicação automaticamente.

## Testes

```bash
python -m unittest discover -s tests -v
node --check static/script.js
node --check static/conversationContext.js
node --test tests/*.mjs
```

### Medindo o consumo de tokens da conversa

`scripts/measure_conversation_tokens.py` mede o consumo real de tokens do
modo "Conversa contínua" em alguns tamanhos de conversa, usando
`client.models.count_tokens` (não gera conteúdo, então é barato, mas ainda
exige uma `GEMINI_API_KEY` válida e faz chamadas reais à API — não faz parte
da suíte de testes automatizada):

```bash
python scripts/measure_conversation_tokens.py
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
| `MAX_CONTEXT_CHARS`         |        30000 | Limite de caracteres do contexto enviado ao modelo        |
| `MAX_REQUEST_BYTES`         |        65536 | Tamanho máximo do corpo da requisição aceito pelo Flask   |
| `MAX_HISTORY_ITEMS`         |           50 | Limite de itens no histórico do navegador                |
| `RATE_LIMIT_REQUESTS`       |           10 | Número máximo de requisições por intervalo               |
| `RATE_LIMIT_WINDOW_SECONDS` |           60 | Duração do intervalo de limitação, em segundos           |

## Privacidade

* Os prompts e as respostas **nunca são armazenados** no servidor
* Todo o histórico permanece apenas no `localStorage` do navegador
* As requisições são validadas e sanitizadas antes do processamento
* A limitação de requisições ajuda a impedir abusos originados de um único endereço IP
  
## Interface

#### Desktop 

<img alt="" src="./assets/interface/demonstration-desktop.gif?v=2">

#### Mobile

<img width="40%" alt="" src="./assets/interface/demonstration-mobile.gif?v=2">

---

<p align="center">Desenvolvedora: <strong>Liane Heidemann</strong></p>
