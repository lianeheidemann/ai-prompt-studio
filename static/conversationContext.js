/** Lógica pura de montagem do contexto conversacional, sem dependência do DOM. */

export function buildConversationContext(history, currentConversationId, { maxContextMessages, maxContextChars }) {
  const maxTurns = Math.floor(maxContextMessages / 2);
  const candidates = history.filter((entry) =>
    entry.mode === "conversation" && entry.conversation_id === currentConversationId
  );
  const selected = [];
  let totalChars = 0;

  for (const entry of candidates) {
    const pairChars = entry.prompt.length + entry.answer.length;
    if (selected.length >= maxTurns || totalChars + pairChars > maxContextChars) break;
    selected.push(entry);
    totalChars += pairChars;
  }

  return selected.reverse().flatMap((entry) => [
    { role: "user", text: entry.prompt },
    { role: "model", text: entry.answer },
  ]);
}

/** Quanto do limite de contexto a próxima mensagem desta conversa vai consumir. */
export function estimateContextUsage(history, currentConversationId, limits) {
  const context = buildConversationContext(history, currentConversationId, limits);
  const chars = context.reduce((total, message) => total + message.text.length, 0);
  return {
    messages: context.length,
    maxMessages: limits.maxContextMessages,
    chars,
    maxChars: limits.maxContextChars,
  };
}
