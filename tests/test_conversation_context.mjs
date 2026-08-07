import { test } from "node:test";
import assert from "node:assert/strict";

import { buildConversationContext, estimateContextUsage } from "../static/conversationContext.js";

const LIMITS = { maxContextMessages: 4, maxContextChars: 1000 };

function entry({ prompt, answer, mode = "conversation", conversationId = "c1" }) {
  return { prompt, answer, mode, conversation_id: conversationId };
}

test("returns an empty context for an empty history", () => {
  assert.deepEqual(buildConversationContext([], "c1", LIMITS), []);
});

test("ignores entries from other conversations or from task mode", () => {
  const history = [
    entry({ prompt: "P1", answer: "A1", conversationId: "other" }),
    entry({ prompt: "P2", answer: "A2", mode: "task" }),
  ];
  assert.deepEqual(buildConversationContext(history, "c1", LIMITS), []);
});

test("orders selected turns chronologically as alternating user/model messages", () => {
  // state.history is newest-first, like the app keeps it.
  const history = [
    entry({ prompt: "Segunda pergunta", answer: "Segunda resposta" }),
    entry({ prompt: "Primeira pergunta", answer: "Primeira resposta" }),
  ];
  assert.deepEqual(buildConversationContext(history, "c1", LIMITS), [
    { role: "user", text: "Primeira pergunta" },
    { role: "model", text: "Primeira resposta" },
    { role: "user", text: "Segunda pergunta" },
    { role: "model", text: "Segunda resposta" },
  ]);
});

test("truncates by number of turns using maxContextMessages / 2", () => {
  const history = [3, 2, 1].map((n) =>
    entry({ prompt: `Pergunta ${n}`, answer: `Resposta ${n}` })
  );
  // maxContextMessages: 4 => at most 2 turns (4 messages) kept, most recent first then reversed.
  const result = buildConversationContext(history, "c1", LIMITS);
  assert.equal(result.length, 4);
  assert.deepEqual(result.map((m) => m.text), [
    "Pergunta 2", "Resposta 2", "Pergunta 3", "Resposta 3",
  ]);
});

test("truncates by accumulated character count", () => {
  const history = [
    entry({ prompt: "a".repeat(40), answer: "b".repeat(40) }),
    entry({ prompt: "c".repeat(40), answer: "d".repeat(40) }),
  ];
  const result = buildConversationContext(history, "c1", { maxContextMessages: 10, maxContextChars: 80 });
  // Only the most recent turn (80 chars) fits; adding the second would exceed 80.
  assert.equal(result.length, 2);
  assert.equal(result[0].text, "a".repeat(40));
  assert.equal(result[1].text, "b".repeat(40));
});

test("estimateContextUsage reports messages/chars that will actually be sent", () => {
  const history = [
    entry({ prompt: "a".repeat(40), answer: "b".repeat(40) }),
    entry({ prompt: "c".repeat(40), answer: "d".repeat(40) }),
  ];
  const usage = estimateContextUsage(history, "c1", { maxContextMessages: 10, maxContextChars: 80 });
  assert.deepEqual(usage, { messages: 2, maxMessages: 10, chars: 80, maxChars: 80 });
});

test("estimateContextUsage is zero for an empty or unrelated history", () => {
  const usage = estimateContextUsage([], "c1", LIMITS);
  assert.deepEqual(usage, { messages: 0, maxMessages: LIMITS.maxContextMessages, chars: 0, maxChars: LIMITS.maxContextChars });
});
