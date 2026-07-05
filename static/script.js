/**
 * AI Prompt Studio — front-end.
 *
 * Responsável por:
 *  - controlar a seleção de categoria;
 *  - enviar o prompt para o backend Flask (/api/generate);
 *  - exibir a resposta e eventuais erros;
 *  - carregar e atualizar o histórico da sessão (/api/history).
 */

const state = {
  selectedCategory: null,
};

const el = {
  chips: document.getElementById("category-chips"),
  promptInput: document.getElementById("prompt-input"),
  charCount: document.getElementById("char-count"),
  submitBtn: document.getElementById("submit-btn"),
  responseCard: document.getElementById("response-card"),
  responseBody: document.getElementById("response-body"),
  copyBtn: document.getElementById("copy-btn"),
  errorCard: document.getElementById("error-card"),
  errorMessage: document.getElementById("error-message"),
  historyList: document.getElementById("history-list"),
  clearHistoryBtn: document.getElementById("clear-history-btn"),
  historyTemplate: document.getElementById("history-item-template"),
};

function init() {
  setupChips();
  setupPromptInput();
  setupSubmit();
  setupCopyButton();
  setupClearHistory();
  loadHistory();
}

/* ---------------------------------------------------------------------- */
/* Categorias                                                              */
/* ---------------------------------------------------------------------- */

function setupChips() {
  const chips = Array.from(el.chips.querySelectorAll(".chip"));

  chips.forEach((chip) => {
    applyChipColor(chip);

    chip.addEventListener("click", () => {
      chips.forEach((c) => {
        c.classList.remove("chip--active");
        c.setAttribute("aria-checked", "false");
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

function applyChipColor(chip) {
  const colorVar = chip.dataset.color; // ex: "var(--cat-resumir)"
  chip.style.setProperty("--chip-color", colorVar);
}

function categoryColor(category) {
  return `var(--cat-${category})`;
}

function categoryLabel(category) {
  const chip = el.chips.querySelector(`.chip[data-category="${category}"]`);
  return chip ? chip.textContent.trim() : category;
}

/* ---------------------------------------------------------------------- */
/* Prompt / contador de caracteres                                        */
/* ---------------------------------------------------------------------- */

function setupPromptInput() {
  el.promptInput.addEventListener("input", () => {
    const count = el.promptInput.value.length;
    el.charCount.textContent = `${count} caractere${count === 1 ? "" : "s"}`;
  });
}

/* ---------------------------------------------------------------------- */
/* Envio do prompt                                                         */
/* ---------------------------------------------------------------------- */

function setupSubmit() {
  el.submitBtn.addEventListener("click", handleSubmit);

  // Ctrl/Cmd + Enter também envia o prompt.
  el.promptInput.addEventListener("keydown", (event) => {
    const isSubmitShortcut = (event.ctrlKey || event.metaKey) && event.key === "Enter";
    if (isSubmitShortcut) {
      event.preventDefault();
      handleSubmit();
    }
  });
}

async function handleSubmit() {
  const prompt = el.promptInput.value.trim();

  hideError();

  if (!prompt) {
    showError("Digite um prompt antes de enviar.");
    return;
  }

  if (!state.selectedCategory) {
    showError("Selecione uma categoria.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        category: state.selectedCategory,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Ocorreu um erro ao consultar o Gemini.");
    }

    showResponse(data);
    prependHistoryItem(data);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  el.submitBtn.disabled = isLoading;
  el.submitBtn.innerHTML = isLoading
    ? '<span class="material-symbols-outlined spin">progress_activity</span> Gerando resposta...'
    : '<span class="material-symbols-outlined">send</span> Enviar para o Gemini';
}

/* ---------------------------------------------------------------------- */
/* Exibição de resposta / erro                                             */
/* ---------------------------------------------------------------------- */

function showResponse(entry) {
  el.responseCard.style.setProperty("--response-color", categoryColor(entry.category));
  document.getElementById("response-title").textContent = `Resposta — ${entry.category_label}`;
  el.responseBody.textContent = entry.answer;
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
      await navigator.clipboard.writeText(el.responseBody.textContent);
      const original = el.copyBtn.innerHTML;
      el.copyBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Copiado';
      setTimeout(() => {
        el.copyBtn.innerHTML = original;
      }, 1500);
    } catch {
      showError("Não foi possível copiar o texto para a área de transferência.");
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Histórico                                                                */
/* ---------------------------------------------------------------------- */

async function loadHistory() {
  try {
    const response = await fetch("/api/history");
    const items = await response.json();
    renderHistory(items);
  } catch {
    // Falha silenciosa: o histórico é um recurso auxiliar, não bloqueia o uso do app.
  }
}

function renderHistory(items) {
  el.historyList.innerHTML = "";

  if (!items || items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "history__empty";
    empty.textContent = "Suas interações aparecerão aqui durante esta sessão.";
    el.historyList.appendChild(empty);
    return;
  }

  items.forEach((item) => el.historyList.appendChild(buildHistoryNode(item)));
}

function prependHistoryItem(entry) {
  const emptyMessage = el.historyList.querySelector(".history__empty");
  if (emptyMessage) {
    emptyMessage.remove();
  }
  el.historyList.insertBefore(buildHistoryNode(entry), el.historyList.firstChild);
}

function buildHistoryNode(entry) {
  const node = el.historyTemplate.content.cloneNode(true);
  const article = node.querySelector(".history-item");

  article.style.setProperty("--item-color", categoryColor(entry.category));
  node.querySelector(".history-item__tag").textContent = entry.category_label;
  node.querySelector(".history-item__time").textContent = entry.timestamp;
  node.querySelector(".history-item__prompt").textContent = entry.prompt;
  node.querySelector(".history-item__answer").textContent = entry.answer;

  return node;
}

function setupClearHistory() {
  el.clearHistoryBtn.addEventListener("click", async () => {
    try {
      await fetch("/api/history/clear", { method: "POST" });
      renderHistory([]);
    } catch {
      showError("Não foi possível limpar o histórico.");
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
