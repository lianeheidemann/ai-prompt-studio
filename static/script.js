/** Front-end stateless: histórico local, conversa contextual e renderização segura. */

import { buildConversationContext, estimateContextUsage } from "./conversationContext.js";

const STORAGE_KEY = "aiPromptStudio.history.v1";
const CONVERSATION_KEY = "aiPromptStudio.currentConversation.v1";
const MODEL_KEY = "aiPromptStudio.selectedModel.v1";
const MAX_HISTORY_ITEMS = Number(document.body.dataset.maxHistoryItems) || 50;
const MAX_CONTEXT_MESSAGES = Number(document.body.dataset.maxContextMessages) || 12;
const MAX_CONTEXT_CHARS = Number(document.body.dataset.maxContextChars) || 30000;

const state = {
  selectedCategory: null,
  selectedModel: null,
  mode: "task",
  history: [],
  currentConversationId: null,
  latestAnswer: "",
  isLoading: false,
  storageBlocked: false,
  modelUsage: {},
};

const el = {
  modeOptions: Array.from(document.querySelectorAll(".mode-option")),
  modelOptions: Array.from(document.querySelectorAll(".model-option")),
  modelUsageStat: document.getElementById("model-usage-stat"),
  modelUsageLabel: document.getElementById("model-usage-label"),
  modelUsageValue: document.getElementById("model-usage-value"),
  modelUsageNote: document.getElementById("model-usage-note"),
  conversationToolbar: document.getElementById("conversation-toolbar"),
  newConversationBtn: document.getElementById("new-conversation-btn"),
  contextUsage: document.getElementById("context-usage"),
  chips: document.getElementById("category-chips"),
  taskFields: Array.from(document.querySelectorAll(".task-fields")),
  sourceLanguage: document.getElementById("source-language"),
  targetLanguage: document.getElementById("target-language"),
  customSourceLanguageGroup: document.getElementById("custom-source-language-group"),
  customSourceLanguage: document.getElementById("custom-source-language"),
  customTargetLanguageGroup: document.getElementById("custom-target-language-group"),
  customTargetLanguage: document.getElementById("custom-target-language"),
  summaryLevelSelect: document.getElementById("summary-level-select"),
  analysisFocusSelect: document.getElementById("analysis-focus-select"),
  codeLanguageSelect: document.getElementById("code-language-select"),
  codeLanguageCustomGroup: document.getElementById("code-language-custom-group"),
  codeLanguageCustom: document.getElementById("code-language-custom"),
  improveStyleSelect: document.getElementById("improve-style-select"),
  improveStyleCustomGroup: document.getElementById("improve-style-custom-group"),
  improveStyleCustom: document.getElementById("improve-style-custom"),
  promptInput: document.getElementById("prompt-input"),
  charCount: document.getElementById("char-count"),
  submitBtn: document.getElementById("submit-btn"),
  responseCard: document.getElementById("response-card"),
  responseTitle: document.getElementById("response-title"),
  responseBody: document.getElementById("response-body"),
  copyBtn: document.getElementById("copy-btn"),
  tokenUsageCard: document.getElementById("token-usage-card"),
  tokenUsageSpent: document.getElementById("token-usage-spent"),
  tokenUsageAvailable: document.getElementById("token-usage-available"),
  tokenUsageBar: document.getElementById("token-usage-bar"),
  tokenUsageBarFill: document.getElementById("token-usage-bar-fill"),
  tokenUsageNote: document.getElementById("token-usage-note"),
  tokenUsageGlobal: document.getElementById("token-usage-global"),
  tokenUsageGlobalValue: document.getElementById("token-usage-global-value"),
  errorCard: document.getElementById("error-card"),
  errorMessage: document.getElementById("error-message"),
  errorActions: document.getElementById("error-actions"),
  historyPanel: document.getElementById("history-panel"),
  historyList: document.getElementById("history-list"),
  clearHistoryBtn: document.getElementById("clear-history-btn"),
  exportHistoryBtn: document.getElementById("export-history-btn"),
  historyTemplate: document.getElementById("history-item-template"),
  toggleHistoryBtn: document.getElementById("toggle-history-btn"),
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
  setupModelSelector();
  setupChips();
  setupTaskFieldControls();
  setupPromptInput();
  setupSubmit();
  setupCopyButton();
  setupHistoryActions();
  setupHistoryToggle();
  renderHistory();
  loadGlobalTokenUsage();
  loadModelUsage();
}

/* Seleção de modelo */

function setupModelSelector() {
  const activeOption = el.modelOptions.find((option) => option.classList.contains("model-option--active"));
  const storedModel = readStoredModel();
  const initialModel = el.modelOptions.some((option) => option.dataset.model === storedModel)
    ? storedModel
    : activeOption?.dataset.model || el.modelOptions[0]?.dataset.model || null;

  state.selectedModel = initialModel;
  el.modelOptions.forEach((option) => {
    option.addEventListener("click", () => selectModel(option.dataset.model));
  });
  applySelectedModel();
}

function selectModel(model) {
  if (!model || model === state.selectedModel) return;
  state.selectedModel = model;
  applySelectedModel();
  persistSelectedModel();
  renderModelUsage();
}

function applySelectedModel() {
  el.modelOptions.forEach((option) => {
    const active = option.dataset.model === state.selectedModel;
    option.classList.toggle("model-option--active", active);
    option.setAttribute("aria-checked", String(active));
  });
}

function readStoredModel() {
  try {
    return window.localStorage.getItem(MODEL_KEY);
  } catch {
    return null;
  }
}

function persistSelectedModel() {
  try {
    window.localStorage.setItem(MODEL_KEY, state.selectedModel);
  } catch {
    // Sem acesso ao localStorage: a escolha vale só para esta sessão.
  }
}

async function loadModelUsage() {
  try {
    const response = await fetch("/api/model-usage");
    if (!response.ok) return;
    const data = await response.json().catch(() => null);
    if (!data || !Array.isArray(data.models)) return;
    state.modelUsage = Object.fromEntries(data.models.map((model) => [model.id, model]));
    renderModelUsage();
  } catch {
    // Sem conexão ou servidor indisponível: mantém o indicador oculto.
  }
}

function renderModelUsage() {
  const usage = state.modelUsage[state.selectedModel];
  if (!usage) return;

  const quotaId = usage.quota_id?.toLowerCase() || "";
  const isPerDay = quotaId.includes("day");
  const isPerMinute = quotaId.includes("minute");

  // O contador de "solicitações" só zera quando o servidor reinicia — nunca
  // sozinho. Isso é comparável a um limite por dia (dá pra ler como "X de Y
  // hoje"), mas não a um limite por minuto: nesse caso o contador continua
  // subindo bem depois da janela de 1 minuto ter sido renovada pelo Google,
  // então mostrar "usado/limite" ali seria enganoso.
  el.modelUsageLabel.textContent = isPerDay
    ? `Solicitações hoje · ${usage.label}`
    : `Solicitações · ${usage.label}`;
  if (usage.quota_limit && isPerDay) {
    el.modelUsageValue.textContent = `${usage.requests_used.toLocaleString("pt-BR")} / ${usage.quota_limit.toLocaleString("pt-BR")}`;
  } else if (usage.quota_limit && isPerMinute) {
    el.modelUsageValue.textContent = `${usage.requests_used.toLocaleString("pt-BR")} (limite: ${usage.quota_limit}/min)`;
  } else {
    el.modelUsageValue.textContent = usage.requests_used.toLocaleString("pt-BR");
  }
  el.modelUsageStat.classList.remove("hidden");
  el.modelUsageStat.classList.toggle("token-usage__stat--warning", usage.limit_reached);
  el.tokenUsageCard.classList.remove("hidden");

  if (usage.limit_reached) {
    if (isPerDay) {
      el.modelUsageNote.textContent = "Limite diário de solicitações deste modelo atingido. Troque de modelo ou aguarde o próximo dia.";
    } else if (isPerMinute) {
      el.modelUsageNote.textContent = `Limite de ${usage.quota_limit} solicitações por minuto deste modelo atingido agora. Aguarde cerca de 1 minuto ou troque de modelo.`;
    } else {
      el.modelUsageNote.textContent = "Limite de solicitações deste modelo atingido. Troque de modelo ou aguarde alguns instantes.";
    }
    el.modelUsageNote.classList.remove("hidden");
    el.modelUsageNote.classList.add("token-usage__note--warning");
  } else {
    el.modelUsageNote.classList.add("hidden");
    el.modelUsageNote.classList.remove("token-usage__note--warning");
  }
}

async function loadGlobalTokenUsage() {
  try {
    const response = await fetch("/api/token-usage");
    if (!response.ok) return;
    const data = await response.json().catch(() => null);
    if (data && typeof data.global_tokens_spent === "number") {
      updateGlobalTokenUsageIndicator(data.global_tokens_spent);
    }
  } catch {
    // Sem conexão ou servidor indisponível: mantém o indicador oculto.
  }
}

function updateGlobalTokenUsageIndicator(globalTokensSpent) {
  el.tokenUsageGlobalValue.textContent = globalTokensSpent.toLocaleString("pt-BR");
  el.tokenUsageGlobal.classList.remove("hidden");
  el.tokenUsageCard.classList.remove("hidden");
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
  updateSubmitLabel();
  if (state.mode === "conversation") updateContextUsageIndicator();
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
  updateContextUsageIndicator();
}

function updateContextUsageIndicator() {
  const usage = estimateContextUsage(state.history, state.currentConversationId, {
    maxContextMessages: MAX_CONTEXT_MESSAGES,
    maxContextChars: MAX_CONTEXT_CHARS,
  });
  const nearLimit = usage.messages >= usage.maxMessages * 0.8 || usage.chars >= usage.maxChars * 0.8;
  el.contextUsage.textContent =
    `${usage.messages}/${usage.maxMessages} mensagens · ${formatCompactNumber(usage.chars)}/${formatCompactNumber(usage.maxChars)} caracteres`;
  el.contextUsage.classList.remove("hidden");
  el.contextUsage.classList.toggle("context-usage--warning", nearLimit);
}

function formatCompactNumber(value) {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(1).replace(".0", "").replace(".", ",")}k`;
}

function updateTokenUsageCard(entry) {
  if (typeof entry.tokens_spent !== "number" || typeof entry.tokens_available !== "number") {
    return;
  }
  const limit = entry.tokens_spent + entry.tokens_available;
  const percentUsedExact = limit > 0 ? Math.min(100, (entry.tokens_spent / limit) * 100) : 0;
  const percentUsedRounded = Math.round(percentUsedExact);
  const nearLimit = percentUsedRounded >= 80;

  el.tokenUsageSpent.textContent = entry.tokens_spent.toLocaleString("pt-BR");
  el.tokenUsageAvailable.textContent = entry.tokens_available.toLocaleString("pt-BR");
  el.tokenUsageBarFill.style.width = `${percentUsedRounded}%`;
  el.tokenUsageBarFill.classList.toggle("token-usage__bar-fill--warning", nearLimit);
  el.tokenUsageBar.setAttribute("aria-valuenow", String(percentUsedRounded));
  const percentLabel = formatPercent(percentUsedExact);
  el.tokenUsageNote.textContent = nearLimit
    ? `${percentLabel} do limite de contexto já foi usado. Considere iniciar uma nova conversa.`
    : `${percentLabel} do limite de contexto usado até agora.`;
  el.tokenUsageNote.classList.toggle("token-usage__note--warning", nearLimit);
  el.tokenUsageCard.classList.remove("hidden");
}

function formatPercent(value) {
  if (value <= 0) return "0%";
  if (value < 0.01) return "<0,01%";
  if (value < 1) return `${value.toFixed(2).replace(".", ",")}%`;
  return `${Math.round(value)}%`;
}

function setupChips() {
  const chips = Array.from(el.chips.querySelectorAll(".chip"));
  chips.forEach((chip) => {
    chip.style.setProperty("--chip-color", chip.dataset.color);
    chip.addEventListener("click", () => {
      if (chip.dataset.category === state.selectedCategory) return;
      resetCategoryFields(state.selectedCategory);
      chips.forEach((item) => {
        item.classList.remove("chip--active");
        item.setAttribute("aria-checked", "false");
      });
      chip.classList.add("chip--active");
      chip.setAttribute("aria-checked", "true");
      state.selectedCategory = chip.dataset.category;
      // Um resultado ou erro anterior pertence à tarefa que o gerou, não à nova seleção.
      el.responseCard.classList.add("hidden");
      hideError();
      applyCategoryPresentation(chip);
    });
    if (chip.classList.contains("chip--active")) {
      state.selectedCategory = chip.dataset.category;
    }
  });
  const activeChip = chips.find((chip) => chip.dataset.category === state.selectedCategory);
  if (activeChip) applyCategoryPresentation(activeChip);
}

function applyCategoryPresentation(chip) {
  updateTaskFields(chip.dataset.category);
  if (chip.dataset.placeholder) el.promptInput.placeholder = chip.dataset.placeholder;
  updateSubmitLabel();
  updateSubmitAvailability();
}

function updateTaskFields(category) {
  el.taskFields.forEach((section) => {
    section.classList.toggle("hidden", section.dataset.taskFields !== category);
  });
}

function resetCategoryFields(category) {
  if (category === "gerar_codigo") {
    el.codeLanguageSelect.value = "";
    el.codeLanguageCustomGroup.classList.add("hidden");
    el.codeLanguageCustom.value = "";
  } else if (category === "melhorar_texto") {
    el.improveStyleSelect.value = "";
    el.improveStyleCustomGroup.classList.add("hidden");
    el.improveStyleCustom.value = "";
  } else if (category === "resumir") {
    el.summaryLevelSelect.value = "";
  } else if (category === "analisar") {
    el.analysisFocusSelect.value = "";
  }
}

function updateSubmitLabel() {
  const activeChip = el.chips.querySelector(".chip--active");
  const taskLabel = (activeChip && activeChip.dataset.buttonLabel) || "Gerar resposta";
  state.submitLabel = state.mode === "conversation" ? "Enviar mensagem" : taskLabel;
  if (!state.isLoading) {
    el.submitBtn.lastChild.textContent = ` ${state.submitLabel}`;
  }
}

function setupTaskFieldControls() {
  selectUserLanguage();
  setupOptionalCustomSelect(el.sourceLanguage, el.customSourceLanguageGroup, el.customSourceLanguage);
  setupOptionalCustomSelect(el.targetLanguage, el.customTargetLanguageGroup, el.customTargetLanguage);
  setupOptionalCustomSelect(el.codeLanguageSelect, el.codeLanguageCustomGroup, el.codeLanguageCustom);
  setupOptionalCustomSelect(el.improveStyleSelect, el.improveStyleCustomGroup, el.improveStyleCustom);
  [el.sourceLanguage, el.targetLanguage, el.customSourceLanguage, el.customTargetLanguage].forEach((field) => {
    field.addEventListener("input", updateSubmitAvailability);
    field.addEventListener("change", updateSubmitAvailability);
  });
}

function setupOptionalCustomSelect(select, customGroup, customInput) {
  select.addEventListener("change", () => {
    const isCustom = select.value === "other";
    customGroup.classList.toggle("hidden", !isCustom);
    if (isCustom) customInput.focus();
  });
}

function selectUserLanguage() {
  const prefix = (navigator.language || "").toLowerCase().split("-")[0];
  const languages = {
    pt: "Português",
    en: "Inglês",
    es: "Espanhol",
    fr: "Francês",
    de: "Alemão",
    it: "Italiano",
    ja: "Japonês",
    zh: "Chinês simplificado",
  };
  const userLanguage = languages[prefix];
  if (userLanguage) el.sourceLanguage.value = userLanguage;
}

function resolvedOptionalValue(select, customInput) {
  if (!select) return "";
  return select.value === "other" ? customInput.value.trim() : select.value;
}

function selectedTargetLanguage() {
  if (state.selectedCategory !== "traduzir") return null;
  return el.targetLanguage.value === "other"
    ? el.customTargetLanguage.value.trim()
    : el.targetLanguage.value;
}

function selectedSourceLanguage() {
  if (state.selectedCategory !== "traduzir") return null;
  return el.sourceLanguage.value === "other"
    ? el.customSourceLanguage.value.trim()
    : el.sourceLanguage.value;
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
    source_language: typeof value.source_language === "string" ? value.source_language : null,
    target_language: typeof value.target_language === "string" ? value.target_language : null,
    prompt: value.prompt,
    answer: value.answer,
    answer_html: typeof value.answer_html === "string" ? value.answer_html : "",
    timestamp: typeof value.timestamp === "string" ? value.timestamp : new Date().toISOString(),
    tokens_spent: typeof value.tokens_spent === "number" ? value.tokens_spent : null,
    tokens_available: typeof value.tokens_available === "number" ? value.tokens_available : null,
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
    warnStorageBlockedOnce();
  }
}

function warnStorageBlockedOnce() {
  if (state.storageBlocked) return;
  state.storageBlocked = true;
  queueMicrotask(() => showError(
    "O navegador bloqueou o armazenamento local. O histórico e a conversa atual não serão salvos ao recarregar a página."
  ));
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
    warnStorageBlockedOnce();
  }
}

function addHistoryEntry(entry) {
  state.history.unshift(entry);
  state.history = state.history.slice(0, MAX_HISTORY_ITEMS);
  persistHistory();
  renderHistory();
  if (state.mode === "conversation") updateContextUsageIndicator();
}

/* Envio */

function setupPromptInput() {
  el.promptInput.addEventListener("input", () => {
    updateCharacterCount();
    updateSubmitAvailability();
  });
}

function updateSubmitAvailability() {
  const hasPrompt = el.promptInput.value.trim().length > 0;
  const validTranslation = state.selectedCategory !== "traduzir"
    || (Boolean(selectedSourceLanguage()) && Boolean(selectedTargetLanguage()));
  el.submitBtn.disabled = state.isLoading || !hasPrompt || !validTranslation;
}

function buildTaskFieldsPrefix(category) {
  if (category === "gerar_codigo") {
    const value = resolvedOptionalValue(el.codeLanguageSelect, el.codeLanguageCustom);
    return value ? `Linguagem ou tecnologia desejada: ${value}\n\n` : "";
  }
  if (category === "melhorar_texto") {
    const value = resolvedOptionalValue(el.improveStyleSelect, el.improveStyleCustom);
    return value ? `Estilo ou objetivo da melhoria: ${value}\n\n` : "";
  }
  if (category === "resumir" && el.summaryLevelSelect.value) {
    return `Formato do resumo desejado: ${el.summaryLevelSelect.value}\n\n`;
  }
  if (category === "analisar" && el.analysisFocusSelect.value) {
    return `Foco da análise esperado: ${el.analysisFocusSelect.value}\n\n`;
  }
  return "";
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

async function handleSubmit() {
  if (state.isLoading) return;
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

  const sourceLanguage = selectedSourceLanguage();
  const targetLanguage = selectedTargetLanguage();
  if (state.selectedCategory === "traduzir" && !sourceLanguage) {
    showError("Escolha o idioma original da tradução.");
    el.sourceLanguage.focus();
    return;
  }
  if (state.selectedCategory === "traduzir" && !targetLanguage) {
    showError("Escolha o idioma de destino da tradução.");
    el.targetLanguage.focus();
    return;
  }

  const category = state.selectedCategory;
  const augmentedPrompt = buildTaskFieldsPrefix(category) + prompt;

  setLoading(true);
  try {
    const requestBody = {
      prompt: augmentedPrompt,
      category,
      model: state.selectedModel,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      mode: state.mode,
      context: state.mode === "conversation"
        ? buildConversationContext(state.history, state.currentConversationId, {
            maxContextMessages: MAX_CONTEXT_MESSAGES,
            maxContextChars: MAX_CONTEXT_CHARS,
          })
        : [],
    };
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const requestError = new Error(data.error || errorMessageForStatus(response.status));
      requestError.code = data.code;
      throw requestError;
    }

    const entry = normalizeEntry({
      ...data,
      // O histórico mostra o texto original do usuário, não o prefixo enviado ao modelo.
      prompt,
      mode: state.mode,
      conversation_id: state.mode === "conversation" ? state.currentConversationId : null,
    });
    if (!entry) throw new Error("A resposta recebida está incompleta.");
    updateTokenUsageCard(entry);
    if (typeof data.global_tokens_spent === "number") {
      updateGlobalTokenUsageIndicator(data.global_tokens_spent);
    }
    if (entry.category !== state.selectedCategory) {
      // O usuário trocou de tarefa enquanto a resposta ainda carregava: só o histórico recebe o resultado.
      addHistoryEntry(entry);
      return;
    }

    state.latestAnswer = entry.answer;
    showResponse(entry);
    addHistoryEntry(entry);
  } catch (error) {
    const message = error instanceof TypeError
      ? "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
      : error.message;
    showError(message || "Não foi possível concluir a solicitação.", { code: error.code });
  } finally {
    setLoading(false);
    loadModelUsage();
  }
}

function errorMessageForStatus(status) {
  if (status === 413) return "A solicitação é grande demais.";
  if (status === 429) return "Muitas solicitações. Aguarde um pouco e tente novamente.";
  if (status >= 500) return "O serviço está temporariamente indisponível.";
  return "Não foi possível processar a solicitação.";
}

function setLoading(isLoading) {
  state.isLoading = isLoading;
  el.newConversationBtn.disabled = isLoading;
  el.chips.querySelectorAll(".chip").forEach((chip) => { chip.disabled = isLoading; });
  el.modeOptions.forEach((option) => { option.disabled = isLoading; });
  el.modelOptions.forEach((option) => { option.disabled = isLoading; });
  el.submitBtn.innerHTML = isLoading
    ? '<span class="material-symbols-outlined spin">progress_activity</span> Gerando resposta...'
    : `<span class="material-symbols-outlined">send</span> ${state.submitLabel || "Gerar resposta"}`;
  updateSubmitAvailability();
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

function appendTokenConsumptionNote(container, entry) {
  if (typeof entry.tokens_spent !== "number") return;
  const note = document.createElement("p");
  note.className = "token-consumption-note";
  note.textContent = `[Tokens Consumidos: ${entry.tokens_spent.toLocaleString("pt-BR")}]`;
  container.appendChild(note);
}

function showResponse(entry) {
  el.responseCard.style.setProperty("--response-color", categoryColor(entry.category));
  el.responseTitle.textContent = `${entry.mode === "conversation" ? "Conversa" : "Resposta"} — ${entry.category_label}`;
  renderMarkdown(el.responseBody, entry.answer_html, entry.answer);
  appendTokenConsumptionNote(el.responseBody, entry);
  el.responseCard.classList.remove("hidden");
  el.responseCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showError(message, { code } = {}) {
  el.errorMessage.textContent = message;
  el.errorActions.replaceChildren();
  if (code === "context_too_large") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn--ghost btn--small";
    button.textContent = "Nova conversa";
    button.addEventListener("click", startNewConversation);
    el.errorActions.appendChild(button);
    el.errorActions.classList.remove("hidden");
  } else {
    el.errorActions.classList.add("hidden");
  }
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
  node.querySelector(".history-item__tag").textContent = entry.target_language
    ? `${entry.source_language || "Automático"} → ${entry.target_language}`
    : entry.category_label;
  node.querySelector(".history-item__mode").textContent = entry.mode === "conversation" ? "Conversa" : "Rápida";
  node.querySelector(".history-item__time").textContent = formatTimestamp(entry.timestamp);
  node.querySelector(".history-item__prompt").textContent = entry.prompt;
  const answerContainer = node.querySelector(".history-item__answer");
  renderMarkdown(answerContainer, entry.answer_html, entry.answer);
  appendTokenConsumptionNote(answerContainer, entry);
  node.querySelector(".history-item__delete").addEventListener("click", () => deleteHistoryEntry(entry.id));
  return node;
}

function deleteHistoryEntry(id) {
  state.history = state.history.filter((entry) => entry.id !== id);
  persistHistory();
  renderHistory();
  if (state.mode === "conversation") updateContextUsageIndicator();
}

function setupHistoryActions() {
  el.clearHistoryBtn.addEventListener("click", () => {
    if (state.history.length === 0) return;
    if (!window.confirm("Excluir todo o histórico salvo neste navegador?")) return;
    state.history = [];
    persistHistory();
    renderHistory();
    if (state.mode === "conversation") updateContextUsageIndicator();
  });

  el.exportHistoryBtn.addEventListener("click", exportHistory);
}

function setupHistoryToggle() {
  setHistoryCollapsed(window.innerWidth <= 900);
  el.toggleHistoryBtn.addEventListener("click", () => {
    setHistoryCollapsed(!el.historyPanel.classList.contains("history--collapsed"));
  });
}

function setHistoryCollapsed(collapsed) {
  el.historyPanel.classList.toggle("history--collapsed", collapsed);
  el.toggleHistoryBtn.setAttribute("aria-expanded", String(!collapsed));
  el.toggleHistoryBtn.setAttribute(
    "aria-label",
    collapsed ? "Mostrar histórico de atividade recente" : "Ocultar histórico de atividade recente"
  );
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
