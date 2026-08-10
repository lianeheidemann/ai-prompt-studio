<div align="center">
  <img width="110" alt="AI Prompt Studio animated logo" src="./assets/icon/logo-robo-giro-horizontal-3d.svg?v=2">

  <h1>
    AI Prompt Studio<br>
    <img alt="Status: in development" src="https://img.shields.io/badge/status-in%20development-6366f1?style=flat-square&amp;logo=git&amp;logoColor=white">
  </h1>
<div></div>
  <p>
    <a href="https://github.com/lianeheidemann/ai-prompt-studio/actions/workflows/tests.yml"><img alt="Tests" src="https://github.com/lianeheidemann/ai-prompt-studio/actions/workflows/tests.yml/badge.svg"></a>
    <a href="https://github.com/lianeheidemann/ai-prompt-studio/actions/workflows/readme-sync.yml"><img alt="Sync README with code changes" src="https://github.com/lianeheidemann/ai-prompt-studio/actions/workflows/readme-sync.yml/badge.svg"></a>
  </p>

  <p>
    <a href="https://www.python.org/"><img alt="Python" src="https://img.shields.io/badge/Python-0D1117?style=for-the-badge&amp;logo=python&amp;logoColor=3776AB"></a>
    <a href="https://flask.palletsprojects.com/"><img alt="Flask" src="https://img.shields.io/badge/Flask-0D1117?style=for-the-badge&amp;logo=flask&amp;logoColor=white"></a>
    <a href="https://ai.google.dev/"><img alt="Gemini API" src="https://img.shields.io/badge/Gemini_API-0D1117?style=for-the-badge&amp;logo=googlegemini&amp;logoColor=8E75B2"></a>
    <a href="https://developer.mozilla.org/docs/Web/HTML"><img alt="HTML5" src="https://img.shields.io/badge/HTML5-0D1117?style=for-the-badge&amp;logo=html5&amp;logoColor=E34F26"></a>
    <a href="https://developer.mozilla.org/docs/Web/CSS"><img alt="CSS3" src="https://img.shields.io/badge/CSS3-0D1117?style=for-the-badge&amp;logo=css3&amp;logoColor=1572B6"></a>
    <a href="https://developer.mozilla.org/docs/Web/JavaScript"><img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-0D1117?style=for-the-badge&amp;logo=javascript&amp;logoColor=F7DF1E"></a>
  </p>
</div>

**Demonstração:** [ai-prompt-studio-av25.onrender.com](https://ai-prompt-studio-av25.onrender.com)

Um ambiente web leve para tarefas assistidas por inteligência artificial com o Google Gemini. Conta com seis fluxos de trabalho especializados, conversas contextuais e histórico armazenado localmente no navegador.

> **Observação:** a interface e todas as mensagens estão disponíveis somente em português (pt-BR), sem seletor de idioma.

## Funcionalidades

- **6 fluxos de trabalho especializados**: resumir, traduzir, explicar código, gerar código, melhorar prompts e criar ideias
- **Dois modos de uso**: tarefa única ou conversa contínua com reconhecimento de contexto
- **Histórico privado**: todos os dados são armazenados localmente no navegador, sem armazenamento no servidor
- **Design responsivo**: funciona de forma fluida em computadores e dispositivos móveis
- **Segurança**: Markdown sanitizado, limites de tamanho das requisições e limitação de solicitações por endereço IP

## Início rápido

### Pré-requisitos

- Python 3.10+
- Chave da API do Google Gemini

### Configuração

1. **Clone e configure o projeto**

   ```bash
   git clone https://github.com/lianeheidemann/ai-prompt-studio.git
   cd ai-prompt-studio
   python -m venv .venv
   ```

   macOS/Linux:

   ```bash
   source .venv/bin/activate
   ```

   Windows (terminal integrado do VS Code — PowerShell):

   ```powershell
   .venv\Scripts\Activate.ps1
   ```

   ```bash
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

- **Backend**: Python 3.10+, Flask 3 e Google Gen AI SDK
- **Frontend**: HTML, CSS e JavaScript, sem frameworks
- **Utilitários**: Mistune para Markdown e Bleach para sanitização

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
| `GEMINI_MAX_CONTEXT_TOKENS` |       1000000 | Janela de contexto do modelo usada para estimar "tokens disponíveis" na interface |
| `MAX_REQUEST_BYTES`         |        65536 | Tamanho máximo do corpo da requisição aceito pelo Flask   |
| `MAX_HISTORY_ITEMS`         |           50 | Limite de itens no histórico do navegador                |
| `RATE_LIMIT_REQUESTS`       |           10 | Número máximo de requisições por intervalo               |
| `RATE_LIMIT_WINDOW_SECONDS` |           60 | Duração do intervalo de limitação, em segundos           |

## Privacidade

- Os prompts e as respostas **nunca são armazenados** no servidor
- Todo o histórico permanece apenas no `localStorage` do navegador
- As requisições são validadas e sanitizadas antes do processamento
- A limitação de requisições ajuda a impedir abusos originados de um único endereço IP

## Interface

#### Desktop 

<img width="80%" alt="" src="./assets/interface/demonstration-desktop.gif?v=3">

#### Mobile

<img width="40%" alt="" src="./assets/interface/demonstration-mobile.gif?v=3">

---

<p align="center">Desenvolvedora: <strong>Liane Heidemann</strong></p>
