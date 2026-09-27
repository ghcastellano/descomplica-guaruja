"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  fallbackIntent,
  interpretationSchema,
  type IntentResponse,
} from "@/lib/intent";
import { CityIcon } from "./city-shell";
import { CityIntake } from "./city-intake";

export function IntentSearch() {
  const [intent, setIntent] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [response, setResponse] = useState<IntentResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const cache = useRef(new Map<string, IntentResponse>());
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (editing) document.getElementById("intencao")?.focus();
  }, [editing]);

  async function interpret(text: string, withAI = true) {
    const value = text.trim();
    if (value.length < 3) {
      setError("Conte um pouco mais sobre o que você precisa.");
      return;
    }
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setIntent(value);
    setSubmitted(value);
    setEditing(false);
    setError("");
    setResponse(null);
    if (!withAI) {
      setBusy(false);
      setResponse({ interpretation: fallbackIntent(value), source: "rules" });
      return;
    }
    const known = cache.current.get(value);
    if (known) {
      setBusy(false);
      setResponse(known);
      return;
    }
    setBusy(true);
    const timeout = setTimeout(() => abort.abort(), 18000);
    try {
      const result = await fetch("/api/city/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value, requestKey: crypto.randomUUID() }),
        signal: abort.signal,
      });
      if (!result.ok) throw Error("interpretation_unavailable");
      const data = await result.json();
      const parsed: IntentResponse = {
        interpretation: interpretationSchema.parse(data.interpretation),
        source: data.source === "ai" ? "ai" : "rules",
      };
      if (controller.current !== abort) return;
      cache.current.set(value, parsed);
      if (cache.current.size > 5)
        cache.current.delete(cache.current.keys().next().value!);
      setResponse(parsed);
    } catch {
      if (controller.current === abort)
        setResponse({ interpretation: fallbackIntent(value), source: "rules" });
    } finally {
      clearTimeout(timeout);
      if (controller.current === abort) setBusy(false);
    }
  }
  const result = response?.interpretation;
  const capacity =
    result?.vertical === "experiencias" &&
    result.guests !== null &&
    (result.guests > 8 || result.guests < 2);
  const composer = (
    <form
      className="intent-search"
      onSubmit={(e) => {
        e.preventDefault();
        void interpret(intent);
      }}
    >
      <label htmlFor="intencao">
        {submitted ? "Ajuste sua ideia" : "Conte pra gente"}
      </label>
      <div>
        <CityIcon name="spark" />
        <textarea
          id="intencao"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          maxLength={600}
          rows={2}
          required
          minLength={3}
          placeholder="Ex.: meu aniversário com mais 3 pessoas no Tombo, amanhã ao pôr do sol"
          aria-describedby="intent-privacy"
        />
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {submitted ? "Atualizar ideia" : "Descomplicar"}{" "}
          <span aria-hidden>→</span>
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </form>
  );
  return (
    <div className={"intent-wrap" + (submitted ? " intent-open" : "")}>
      {!submitted || editing ? (
        composer
      ) : (
        <div className="prompt-echo">
          <span className="eyebrow">SUA IDEIA, NOSSO PONTO DE PARTIDA</span>
          <p>{submitted}</p>
          <button
            className="text-button"
            onClick={() => {
              controller.current?.abort();
              controller.current = null;
              setBusy(false);
              setResponse(
                (old) =>
                  old || {
                    interpretation: fallbackIntent(submitted || ""),
                    source: "rules",
                  },
              );
              setEditing(true);
            }}
          >
            Editar pedido
          </button>
        </div>
      )}
      {(!submitted || editing) && (
        <p className="intent-privacy" id="intent-privacy">
          A IA ajuda a organizar sua ideia. Você revisa antes de enviar. Deixe
          seu contato para depois.{" "}
          <Link href="/privacidade" prefetch={false}>
            Saiba mais
          </Link>
        </p>
      )}
      {editing && (
        <button
          className="text-button"
          onClick={() => {
            setIntent(submitted || "");
            setEditing(false);
          }}
        >
          Manter ideia anterior
        </button>
      )}
      {busy && (
        <section className="concierge-loading" role="status" aria-live="polite">
          <div className="concierge-orbit" aria-hidden="true">
            <CityIcon name="spark" />
          </div>
          <div>
            <span className="eyebrow">COMEÇA COM A SUA IDEIA</span>
            <h2>Dando forma ao seu pedido…</h2>
            <p>
              Vamos organizar o que você contou para escolhermos os próximos
              detalhes.
            </p>
          </div>
        </section>
      )}
      {!busy && result && (
        <div hidden={editing}>
          <p className="intent-response-note" role="status">
            {response?.source === "ai"
              ? "Organizamos sua ideia com IA. Confira os detalhes e ajuste o que quiser."
              : "Vamos montar juntos. Confira a sugestão e escolha os próximos detalhes."}
          </p>
          {capacity ? (
            <section className="concierge-response">
              <span className="eyebrow">UM MOMENTO DO TAMANHO CERTO</span>
              <h2>Hoje, nossas experiências recebem de 2 a 8 pessoas.</h2>
              <p>
                Você mencionou {result.guests} pessoas. A coleção A Dois é
                exclusiva para o casal. Para outro tamanho de grupo, ajuste o
                pedido antes de continuar.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setEditing(true)}
              >
                Ajustar minha ideia →
              </button>
            </section>
          ) : result.discovery ? (
            <section
              className="concierge-response"
              aria-label="Sugestões para descobrir Guarujá"
            >
              <span className="eyebrow">UM BOM COMEÇO</span>
              <h2>A cidade tem mais de um jeito de surpreender.</h2>
              <p>Praia, paisagem ou uma experiência preparada para você?</p>
              <div className="concierge-choices">
                <Link
                  prefetch={false}
                  href="/descobrir"
                  className="choice-tile"
                >
                  <CityIcon name="descobrir" />
                  <strong>Conhecer a cidade</strong>
                  <span>Explore praias e pontos de interesse →</span>
                </Link>
                <button
                  className="choice-tile"
                  onClick={() =>
                    void interpret("Quero uma experiência no Guarujá", false)
                  }
                >
                  <CityIcon name="experiencias" />
                  <strong>Viver uma experiência</strong>
                  <span>Um momento organizado pela nossa equipe →</span>
                </button>
              </div>
            </section>
          ) : (
            <CityIntake
              key={submitted}
              embedded
              intent={submitted || ""}
              initialType={result.vertical}
              initialCategory={result.category}
              initialGuests={result.guests || undefined}
              initialNeighborhood={result.neighborhood}
              initialDate={result.date}
              initialPeriod={result.period}
            />
          )}
        </div>
      )}
      {!submitted && (
        <div className="intent-chips">
          <span>Ou comece por</span>
          {[
            "Um momento a dois",
            "Limpeza da casa",
            "Preparar minha chegada",
          ].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => void interpret(t, false)}
            >
              {t} →
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
