/** Front-end stateless: histórico local, conversa contextual e renderização segura. */

const STORAGE_KEY = "aiPromptStudio.history.v1";
const CONVERSATION_KEY = "aiPromptStudio.currentConversation.v1";
const MAX_HISTORY_ITEMS = Number(document.body.dataset.maxHistoryItems) || 50;
const MAX_CONTEXT_MESSAGES = Number(document.body.dataset.maxContextMessages) || 12;
const MAX_CONTEXT_CHARS = Number(document.body.dataset.maxContextChars) || 30000;

const state = {
  selectedCategory: null,
  mode: "task",
  history: [],
  currentConversationId: null,
  latestAnswer: "",
};

const el = {
  modeOptions: Array.from(document.querySelectorAll(".mode-option")),
  conversationToolbar: document.getElementById("conversation-toolbar"),
  newConversationBtn: document.getElementById("new-conversation-btn"),
  chips: document.getElementById("category-chips"),
  promptInput: document.getElementById("prompt-input"),
  charCount: document.getElementById("char-count"),
  submitBtn: document.getElementById("submit-btn"),
  responseCard: document.getElementById("response-card"),
  responseTitle: document.getElementById("response-title"),
  responseBody: document.getElementById("response-body"),
  copyBtn: document.getElementById("copy-btn"),
  errorCard: document.getElementById("error-card"),
  errorMessage: document.getElementById("error-message"),
  historyList: document.getElementById("history-list"),
  clearHistoryBtn: document.getElementById("clear-history-btn"),
  exportHistoryBtn: document.getElementById("export-history-btn"),
  historyTemplate: document.getElementById("history-item-template"),
};

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function init() {
  loadLocalState();
  setupModes();
  setupChips();
  setupPromptInput();
  setupSubmit();
  setupCopyButton();
  setupHistoryActions();
  renderHistory();
}

/* Modos e categorias */

function setupModes() {
  el.modeOptions.forEach((option) => {
    option.addEventListener("click", () => setMode(option.dataset.mode));
  });
  el.newConversationBtn.addEventListener("click", startNewConversation);
  setMode("task");
}

function setMode(mode) {
  state.mode = mode === "conversation" ? "conversation" : "task";
  el.modeOptions.forEach((option) => {
    const active = option.dataset.mode === state.mode;
    option.classList.toggle("mode-option--active", active);
    option.setAttribute("aria-checked", String(active));
  });
  el.conversationToolbar.classList.toggle("hidden", state.mode !== "conversation");
  el.submitBtn.lastChild.textContent = state.mode === "conversation"
    ? " Enviar mensagem"
    : " Gerar resposta";
}

function startNewConversation() {
  state.currentConversationId = createId();
  persistConversationId();
  state.latestAnswer = "";
  el.responseCard.classList.add("hidden");
  el.promptInput.value = "";
  updateCharacterCount();
  el.promptInput.focus();
  hideError();
}

function setupChips() {
  const chips = Array.from(el.chips.querySelectorAll(".chip"));
  chips.forEach((chip) => {
    chip.style.setProperty("--chip-color", chip.dataset.color);
    chip.addEventListener("click", () => {
      chips.forEach((item) => {
        item.classList.remove("chip--active");
        item.setAttribute("aria-checked", "false");
      });
      chip.classList.add("chip--active");
      chip.setAttribute("aria-checked", "true");
      state.selectedCategory = chip.dataset.category;
    });
    if (chip.classList.contains("chip--active")) {
      state.selectedCategory = chip.dataset.category;
    }
  });
}

function normalizeCategory(category) {
  const chip = Array.from(el.chips.querySelectorAll(".chip"))
    .find((item) => item.dataset.category === category);
  return chip ? category : "resumir";
}

function categoryColor(category) {
  return `var(--cat-${normalizeCategory(category)})`;
}

function categoryLabel(category) {
  const safeCategory = normalizeCategory(category);
  const chip = Array.from(el.chips.querySelectorAll(".chip"))
    .find((item) => item.dataset.category === safeCategory);
  return chip ? chip.textContent.trim() : "Resumir texto";
}

/* localStorage */

function normalizeEntry(value) {
  if (!value || typeof value !== "object") return null;
  if (typeof value.prompt !== "string" || typeof value.answer !== "string") return null;
  const category = normalizeCategory(value.category);
  return {
    id: String(value.id || createId()),
    category,
    category_label: typeof value.category_label === "string"
      ? value.category_label
      : categoryLabel(category),
    mode: value.mode === "conversation" ? "conversation" : "task",
    conversation_id: typeof value.conversation_id === "string" ? value.conversation_id : null,
    prompt: value.prompt,
    answer: value.answer,
    answer_html: typeof value.answer_html === "string" ? value.answer_html : "",
    timestamp: typeof value.timestamp === "string" ? value.timestamp : new Date().toISOString(),
  };
}

function loadLocalState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    state.history = Array.isArray(parsed)
      ? parsed.map(normalizeEntry).filter(Boolean).slice(0, MAX_HISTORY_ITEMS)
      : [];
    state.currentConversationId = localStorage.getItem(CONVERSATION_KEY) || createId();
    persistConversationId();
  } catch {
    state.history = [];
    state.currentConversationId = createId();
    queueMicrotask(() => showError("O navegador bloqueou o armazenamento local. O histórico durará somente nesta página."));
  }
}

function persistHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
    return true;
  } catch {
    showError("Não foi possível salvar o histórico. O armazenamento do navegador pode estar cheio ou bloqueado.");
    return false;
  }
}

function persistConversationId() {
  try {
    localStorage.setItem(CONVERSATION_KEY, state.currentConversationId);
  } catch {
    // O modo de conversa ainda funciona durante a página atual.
  }
}

function addHistoryEntry(entry) {
  state.history.unshift(entry);
  state.history = state.history.slice(0, MAX_HISTORY_ITEMS);
  persistHistory();
  renderHistory();
}

/* Envio */

function setupPromptInput() {
  el.promptInput.addEventListener("input", updateCharacterCount);
}

function updateCharacterCount() {
  el.charCount.textContent = String(el.promptInput.value.length);
}

function setupSubmit() {
  el.submitBtn.addEventListener("click", handleSubmit);
  el.promptInput.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  });
}

function buildConversationContext() {
  const maxTurns = Math.floor(MAX_CONTEXT_MESSAGES / 2);
  const candidates = state.history.filter((entry) =>
    entry.mode === "conversation" && entry.conversation_id === state.currentConversationId
  );
  const selected = [];
  let totalChars = 0;

  for (const entry of candidates) {
    const pairChars = entry.prompt.length + entry.answer.length;
    if (selected.length >= maxTurns || totalChars + pairChars > MAX_CONTEXT_CHARS) break;
    selected.push(entry);
    totalChars += pairChars;
  }

  return selected.reverse().flatMap((entry) => [
    { role: "user", text: entry.prompt },
    { role: "model", text: entry.answer },
  ]);
}

async function handleSubmit() {
  if (el.submitBtn.disabled) return;
  const prompt = el.promptInput.value.trim();
  hideError();

  if (!prompt) {
    showError("Digite uma pergunta antes de enviar.");
    return;
  }
  if (!state.selectedCategory) {
    showError("Selecione uma categoria.");
    return;
  }

  setLoading(true);
  try {
    const requestBody = {
      prompt,
      category: state.selectedCategory,
      mode: state.mode,
      context: state.mode === "conversation" ? buildConversationContext() : [],
    };
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || errorMessageForStatus(response.status));
    }

    const entry = normalizeEntry({
      ...data,
      mode: state.mode,
      conversation_id: state.mode === "conversation" ? state.currentConversationId : null,
    });
    if (!entry) throw new Error("A resposta recebida está incompleta.");

    state.latestAnswer = entry.answer;
    showResponse(entry);
    addHistoryEntry(entry);
  } catch (error) {
    const message = error instanceof TypeError
      ? "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
      : error.message;
    showError(message || "Não foi possível concluir a solicitação.");
  } finally {
    setLoading(false);
  }
}

function errorMessageForStatus(status) {
  if (status === 413) return "A solicitação é grande demais.";
  if (status === 429) return "Muitas solicitações. Aguarde um pouco e tente novamente.";
  if (status >= 500) return "O serviço está temporariamente indisponível.";
  return "Não foi possível processar a solicitação.";
}

function setLoading(isLoading) {
  el.submitBtn.disabled = isLoading;
  el.newConversationBtn.disabled = isLoading;
  el.submitBtn.innerHTML = isLoading
    ? '<span class="material-symbols-outlined spin">progress_activity</span> Gerando resposta...'
    : `<span class="material-symbols-outlined">send</span> ${state.mode === "conversation" ? "Enviar mensagem" : "Gerar resposta"}`;
}

/* Markdown: o servidor usa Bleach e o navegador aplica uma segunda allowlist. */

const ALLOWED_MARKDOWN_TAGS = new Set([
  "A", "BLOCKQUOTE", "BR", "CODE", "DEL", "EM", "H1", "H2", "H3", "H4",
  "H5", "H6", "HR", "LI", "OL", "P", "PRE", "STRONG", "TABLE", "TBODY",
  "TD", "TH", "THEAD", "TR", "UL",
]);

function safeHref(value) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

function sanitizeMarkdownHtml(html) {
  const parsed = new DOMParser().parseFromString(html, "text/html");

  function sanitizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();

    const fragment = document.createDocumentFragment();
    if (!ALLOWED_MARKDOWN_TAGS.has(node.tagName)) {
      Array.from(node.childNodes).forEach((child) => fragment.appendChild(sanitizeNode(child)));
      return fragment;
    }

    const clean = document.createElement(node.tagName.toLowerCase());
    if (node.tagName === "A") {
      const href = safeHref(node.getAttribute("href"));
      if (href) clean.setAttribute("href", href);
      const title = node.getAttribute("title");
      if (title) clean.setAttribute("title", title);
      clean.setAttribute("rel", "noopener noreferrer");
    }
    if (node.tagName === "CODE") {
      const className = node.getAttribute("class") || "";
      if (/^language-[a-z0-9_-]+$/i.test(className)) clean.className = className;
    }
    Array.from(node.childNodes).forEach((child) => clean.appendChild(sanitizeNode(child)));
    return clean;
  }

  const output = document.createDocumentFragment();
  Array.from(parsed.body.childNodes).forEach((node) => output.appendChild(sanitizeNode(node)));
  return output;
}

function renderMarkdown(container, html, fallbackText) {
  if (html) {
    container.replaceChildren(sanitizeMarkdownHtml(html));
  } else {
    container.textContent = fallbackText || "";
  }
}

function showResponse(entry) {
  el.responseCard.style.setProperty("--response-color", categoryColor(entry.category));
  el.responseTitle.textContent = `${entry.mode === "conversation" ? "Conversa" : "Resposta"} — ${entry.category_label}`;
  renderMarkdown(el.responseBody, entry.answer_html, entry.answer);
  el.responseCard.classList.remove("hidden");
  el.responseCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showError(message) {
  el.errorMessage.textContent = message;
  el.errorCard.classList.remove("hidden");
}

function hideError() {
  el.errorCard.classList.add("hidden");
}

function setupCopyButton() {
  el.copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(state.latestAnswer || el.responseBody.textContent || "");
      const original = el.copyBtn.innerHTML;
      el.copyBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Copiado';
      setTimeout(() => { el.copyBtn.innerHTML = original; }, 1500);
    } catch {
      showError("Não foi possível copiar a resposta para a área de transferência.");
    }
  });
}

/* Histórico local */

function renderHistory() {
  el.historyList.replaceChildren();
  if (state.history.length === 0) {
    const empty = document.createElement("p");
    empty.className = "history__empty";
    empty.textContent = "Suas respostas aparecerão aqui para você retomar quando quiser.";
    el.historyList.appendChild(empty);
    return;
  }
  state.history.forEach((entry) => el.historyList.appendChild(buildHistoryNode(entry)));
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? timestamp
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function buildHistoryNode(entry) {
  const node = el.historyTemplate.content.cloneNode(true);
  const article = node.querySelector(".history-item");
  article.style.setProperty("--item-color", categoryColor(entry.category));
  node.querySelector(".history-item__tag").textContent = entry.category_label;
  node.querySelector(".history-item__mode").textContent = entry.mode === "conversation" ? "Conversa" : "Rápida";
  node.querySelector(".history-item__time").textContent = formatTimestamp(entry.timestamp);
  node.querySelector(".history-item__prompt").textContent = entry.prompt;
  renderMarkdown(node.querySelector(".history-item__answer"), entry.answer_html, entry.answer);
  node.querySelector(".history-item__delete").addEventListener("click", () => deleteHistoryEntry(entry.id));
  return node;
}

function deleteHistoryEntry(id) {
  state.history = state.history.filter((entry) => entry.id !== id);
  persistHistory();
  renderHistory();
}

function setupHistoryActions() {
  el.clearHistoryBtn.addEventListener("click", () => {
    if (state.history.length === 0) return;
    if (!window.confirm("Excluir todo o histórico salvo neste navegador?")) return;
    state.history = [];
    persistHistory();
    renderHistory();
  });

  el.exportHistoryBtn.addEventListener("click", exportHistory);
}

function exportHistory() {
  if (state.history.length === 0) {
    showError("Não há histórico para exportar.");
    return;
  }
  const payload = {
    application: "AI Prompt Studio",
    exported_at: new Date().toISOString(),
    items: [...state.history].reverse(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ai-prompt-studio-historico-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", init);
