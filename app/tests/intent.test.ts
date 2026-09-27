import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  fallbackIntent,
  normalizeInterpretation,
  redactContact,
} from "../lib/intent";
const url = new URL(process.env.DATABASE_URL!);
if (url.hostname !== "127.0.0.1" || url.pathname !== "/descomplica_test")
  throw Error("Only local isolated tests");
const { db } = await import("../lib/db");
const { migrate } = await import("../scripts/migrate");
const {
  inferIntent,
  interpretIntent,
  reserveInterpretation,
  RESERVATION_MICRO_USD,
} = await import("../lib/intent-ai");
before(async () => {
  await migrate();
  await db`DELETE FROM ai_interpretations`;
});
after(async () => {
  await db.end();
});
const valid = {
  discovery: false,
  vertical: "experiencias",
  category: "Celebrar",
  guests: 4,
  neighborhood: "Tombo",
  date: "",
  period: "por-do-sol",
};
const completed = (obj: unknown = valid) =>
  Response.json({
    status: "completed",
    output: [
      {
        type: "message",
        content: [{ type: "output_text", text: JSON.stringify(obj) }],
      },
    ],
    usage: { input_tokens: 700, output_tokens: 60 },
  });
test("allowed categories, impossible dates and A Dois capacity remain deterministic", () => {
  assert.throws(() =>
    normalizeInterpretation(
      { ...valid, category: "Serviço inventado" },
      "2026-09-27",
    ),
  );
  assert.throws(() =>
    normalizeInterpretation({ ...valid, price: 1 }, "2026-09-27"),
  );
  assert.equal(
    normalizeInterpretation({ ...valid, date: "2027-02-30" }, "2026-09-27")
      .date,
    "",
  );
  assert.equal(
    normalizeInterpretation({ ...valid, date: "2020-01-01" }, "2026-09-27")
      .date,
    "",
  );
  assert.equal(
    normalizeInterpretation({ ...valid, category: "A Dois" }, "2026-09-27")
      .category,
    "",
  );
  assert.equal(
    normalizeInterpretation({ ...valid, guests: 50 }, "2026-09-27").guests,
    50,
  );
  assert.equal(fallbackIntent("Aniversário para 50 pessoas").guests, 50);
  assert.equal(
    redactContact("Maria teste@example.invalid (13) 98852-3663"),
    "Maria [contato removido] [contato removido]",
  );
});
test("provider request is bounded, contact redacted, strict output, no tools or storage", async () => {
  let called = 0;
  const response = await inferIntent(
    "Aniversário: teste@example.invalid (13) 98852-3663",
    async (url, opts) => {
      called++;
      assert.equal(url, "https://api.openai.com/v1/responses");
      const body = JSON.parse(String(opts?.body));
      assert.equal(body.model, "gpt-5.6-luna");
      assert.equal(body.store, false);
      assert.equal(body.reasoning.effort, "none");
      assert.equal(body.max_output_tokens, 480);
      assert.equal(body.text.format.strict, true);
      assert.equal(body.tools, undefined);
      assert.ok(!body.input.includes("teste@example.invalid"));
      assert.ok(!body.input.includes("98852"));
      assert.ok(opts?.signal);
      return completed();
    },
  );
  assert.equal(called, 1);
  assert.equal(response.interpretation.guests, 4);
});
test("invalid/refused/incomplete output and upstream failures are rejected without retries", async () => {
  for (const response of [
    completed({ ...valid, category: "inventado" }),
    Response.json({ status: "incomplete" }),
    Response.json({
      status: "completed",
      output: [{ content: [{ type: "refusal" }] }],
    }),
    new Response("", { status: 429 }),
  ]) {
    let calls = 0;
    await assert.rejects(
      inferIntent("aniversário", async () => {
        calls++;
        return response;
      }),
    );
    assert.equal(calls, 1);
  }
});
test("concurrent reservations enforce hard app budget across processes and idempotency", async () => {
  await db`DELETE FROM ai_interpretations`;
  const limits = { calls: 50, microUsd: RESERVATION_MICRO_USD * 3, hourly: 50 };
  const answers = await Promise.all(
    Array.from({ length: 12 }, () =>
      reserveInterpretation(randomUUID(), "same-client", limits),
    ),
  );
  assert.equal(answers.filter(Boolean).length, 3);
  await db`DELETE FROM ai_interpretations`;
  const id = randomUUID();
  const duplicate = await Promise.all(
    Array.from({ length: 6 }, () =>
      reserveInterpretation(id, "same-client", limits),
    ),
  );
  assert.equal(duplicate.filter(Boolean).length, 1);
  const [row] = await db`SELECT count(*)::int as count FROM ai_interpretations`;
  assert.equal(row.count, 1);
});
test("client and daily request caps both apply before provider calls", async () => {
  await db`DELETE FROM ai_interpretations`;
  const limits = { calls: 2, microUsd: 100000, hourly: 1 };
  assert.equal(
    await reserveInterpretation(randomUUID(), "first", limits),
    true,
  );
  assert.equal(
    await reserveInterpretation(randomUUID(), "first", limits),
    false,
  );
  assert.equal(
    await reserveInterpretation(randomUUID(), "second", limits),
    true,
  );
  assert.equal(
    await reserveInterpretation(randomUUID(), "third", limits),
    false,
  );
});
test("AI disabled costs nothing; errors and exhausted budgets keep fallback; ledger has no prompts", async () => {
  await db`DELETE FROM ai_interpretations`;
  let calls = 0;
  const mock = async () => {
    calls++;
    return new Response("", { status: 503 });
  };
  assert.equal(
    (
      await interpretIntent(
        "Aniversário para 4 pessoas",
        randomUUID(),
        "client",
        mock,
      )
    ).source,
    "rules",
  );
  assert.equal(calls, 0);
  process.env.AI_ENABLED = "true";
  process.env.OPENAI_API_KEY = "test-placeholder";
  try {
    const id = randomUUID();
    assert.equal(
      (await interpretIntent("Aniversário para 4 pessoas", id, "client", mock))
        .source,
      "rules",
    );
    assert.equal(calls, 1);
    assert.equal(
      (await interpretIntent("Aniversário para 4 pessoas", id, "client", mock))
        .source,
      "rules",
    );
    assert.equal(calls, 1);
    const [failed] = await db`SELECT * FROM ai_interpretations WHERE id=${id}`;
    assert.equal(failed.state, "fallback");
    assert.equal(failed.reserved_micro_usd, 4000);
    const success = await interpretIntent(
      "Aniversário para 4 pessoas",
      randomUUID(),
      "client",
      async () => completed(),
    );
    assert.equal(success.source, "ai");
    const [row] =
      await db`SELECT * FROM ai_interpretations WHERE state='completed'`;
    assert.equal(row.input_tokens, 700);
    assert.equal(row.estimated_micro_usd, 247);
    assert.equal(row.prompt, undefined);
    process.env.AI_DAILY_CALL_LIMIT = "0";
    await interpretIntent("Aniversário", randomUUID(), "client", mock);
    assert.equal(calls, 1);
  } finally {
    process.env.AI_ENABLED = "false";
    process.env.OPENAI_API_KEY = "";
    delete process.env.AI_DAILY_CALL_LIMIT;
  }
});
