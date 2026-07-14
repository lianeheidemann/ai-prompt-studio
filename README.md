# AI Prompt Studio

Aplicação web em Flask para executar tarefas especializadas e manter conversas com a API do Google Gemini.

## Funcionalidades

- Seis categorias com instrução e temperatura próprias: resumo, tradução, explicação de código, geração de código, melhoria de prompt e brainstorm.
- Modo **Tarefa única**, sem contexto anterior.
- Modo **Conversa**, que envia ao Gemini apenas as mensagens recentes da conversa atual.
- Histórico salvo no `localStorage`, sem login e sem armazenamento de conversas no Flask.
- Exclusão individual, limpeza completa e exportação do histórico em JSON.
- Markdown renderizado no servidor com Mistune e sanitizado com Bleach; o navegador aplica uma segunda lista de elementos permitidos.
- Limites de tamanho para prompt, contexto e corpo HTTP.
- Rate limiting simples por IP.
- Mensagens públicas de erro sem exposição da exceção interna da API.

## Privacidade e funcionamento do contexto

O servidor é stateless: ele não possui rota de histórico e não mantém prompts ou respostas em memória. O histórico permanece no perfil atual do navegador e pode desaparecer se os dados do site forem apagados ou se a janela anônima for fechada.

No modo Conversa, o navegador envia as interações recentes da conversa atual junto da nova pergunta. Esse contexto é usado somente na chamada atual ao Gemini e descartado pelo Flask ao final da requisição.

## Tecnologias

- Python 3.10+
- Flask 3
- Google Gen AI SDK
- Mistune e Bleach
- HTML, CSS e JavaScript sem framework
- `localStorage`

## Instalação

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

No Linux ou macOS, use `source venv/bin/activate` e `cp .env.example .env`.

Configure pelo menos:

```env
GEMINI_API_KEY=sua_chave
GEMINI_MODEL=gemini-3.5-flash
```

Acesse `http://localhost:5000`.

## Configurações de limite

| Variável | Padrão | Finalidade |
|---|---:|---|
| `MAX_PROMPT_LENGTH` | 10000 | Caracteres por pergunta |
| `MAX_CONTEXT_MESSAGES` | 12 | Mensagens anteriores enviadas no modo Conversa |
| `MAX_CONTEXT_CHARS` | 30000 | Caracteres totais do contexto |
| `MAX_REQUEST_BYTES` | 65536 | Tamanho máximo do corpo HTTP |
| `RATE_LIMIT_REQUESTS` | 10 | Requisições por IP na janela |
| `RATE_LIMIT_WINDOW_SECONDS` | 60 | Duração da janela do rate limit |
| `MAX_HISTORY_ITEMS` | 50 | Itens preservados em cada navegador |

O rate limiter incluído é adequado para uma única instância. Em produção com múltiplos processos ou servidores, use um armazenamento compartilhado como Redis e configure corretamente o proxy reverso.

## Testes

Os testes não consomem a API do Gemini:

```bash
python -m unittest discover -s tests -v
node --check static/script.js
```

## Estrutura

```text
app.py                     Rotas, validações, rate limit e Markdown
config.py                  Configuração por variáveis de ambiente
services/gemini_service.py Integração stateless com o Gemini
templates/index.html       Interface
static/script.js           localStorage, contexto e interações
static/style.css           Estilos responsivos
tests/test_app.py          Testes do backend e do contrato da IA
```
