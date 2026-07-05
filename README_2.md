<div align="center">

# 🧠 AI Prompt Studio

### Um playground de Prompt Engineering integrado à API do Google Gemini

Projeto de portfólio construído para praticar **Python, Flask e integração com LLMs** 

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Gemini API](https://img.shields.io/badge/Google-Gemini_API-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[Demonstração](#-demonstração) •
[Funcionalidades](#-funcionalidades) •
[Tecnologias](#-tecnologias) •
[Como rodar](#-como-rodar-localmente) •
[Sobre mim](#-sobre-mim)

</div>

---

## 🎯 Sobre o projeto

**AI Prompt Studio** é uma aplicação web onde o usuário escreve um prompt, escolhe uma categoria de tarefa (resumir, traduzir, explicar código, gerar código, melhorar prompt ou brainstorm) e recebe uma resposta gerada pela **API do Google Gemini** em tempo real — com histórico da sessão exibido na tela.

---

## 🖼️ Demonstração

<div align="center">

<!-- Substitua pelos prints reais da aplicação rodando -->
<img src="docs/assets/screenshot-home.png" alt="Tela principal do AI Prompt Studio" width="800"/>

<br/><br/>

<img src="docs/assets/screenshot-response.png" alt="Exemplo de resposta gerada pelo Gemini" width="800"/>

</div>

> 📌 *Dica: gravar um GIF

---

## ✨ Funcionalidades

-  Envio de prompts para a API do Gemini com resposta em tempo real
-  6 categorias de tarefa, cada uma com uma instrução de sistema própria e otimizada
-  Histórico de conversas da sessão, com cópia rápida da resposta
-  Interface responsiva, com identidade visual inspirada no Material Design do Google
-  Tratamento de erros amigável (chave ausente, prompt vazio, falha de API)
-  Zero dependência de banco de dados — 100% funcional após configurar uma chave de API

---

## 🧰 Tecnologias

| Categoria | Stack |
|---|---|
| **Linguagem** | Python 3 |
| **Backend** | Flask |
| **IA Generativa** | Google Gemini API (`google-genai`) |
| **Frontend** | HTML5, CSS3, JavaScript (vanilla) |
| **Configuração** | python-dotenv |

---

## 💡 O que este projeto demonstra

Como este repositório também serve como parte do meu portfólio para processos seletivos, aqui está um resumo direto das habilidades técnicas praticadas:

- **Python aplicado**: funções pequenas e com responsabilidade única, type hints, tratamento de exceções customizadas.
- **Backend com Flask**: organização de rotas, separação entre camada HTTP e lógica de negócio, uso de variáveis de ambiente para configuração.
- **Integração com APIs externas**: consumo de uma API de LLM em produção (Google Gemini), incluindo tratamento de falhas de rede/autenticação.
- **Prompt Engineering**: construção de *system instructions* específicas para cada categoria de tarefa, otimizando a resposta do modelo para cada caso de uso.
- **Frontend sem frameworks**: manipulação de DOM, `fetch API`, atualização de interface em tempo real — sem depender de React/Vue.
- **Boas práticas de engenharia**: código limpo, `.gitignore` correto, `.env.example` documentado, README estruturado, separação de pastas (`services/`, `templates/`, `static/`).

---

## 📂 Estrutura do projeto

```
ai-prompt-studio/
├── app.py                  # Rotas Flask
├── config.py                # Configuração via variáveis de ambiente
├── services/
│   └── gemini_service.py    # Integração com a API do Gemini
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   └── script.js
├── requirements.txt
├── .env.example
└── README.md
```

📖 Documentação de instalação completa: [`README.md`](README.md)

---

## ⚙️ Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/ai-prompt-studio.git
cd ai-prompt-studio

# Crie o ambiente virtual e instale as dependências
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure sua chave da API
cp .env.example .env
# Edite o .env e insira sua GEMINI_API_KEY (grátis em https://aistudio.google.com/app/apikey)

# Rode a aplicação
python app.py
```

Acesse em `http://localhost:5000` 🚀

---

## 📈 Próximos passos

- [ ] Testes automatizados com `pytest`
- [ ] Deploy público (Render/Railway) para demonstração ao vivo
- [ ] Persistência opcional de histórico (SQLite)
- [ ] Streaming de resposta (efeito de digitação)

---

<div align="center">

**⭐ Se este projeto te ajudou ou te interessou, considere deixar uma estrela no repositório!**

</div>
