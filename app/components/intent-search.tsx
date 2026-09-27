"use client";
import { useState } from "react";
import Link from "next/link";
import {
  isDiscoveryIntent,
  suggestVertical,
  suggestCategory,
} from "@/lib/city-catalog";
import { CityIcon } from "./city-shell";
import { CityIntake } from "./city-intake";
export function IntentSearch() {
  const [intent, setIntent] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const type = suggestVertical(submitted || "");
  const count = submitted?.match(
    /\b([2-8])\s*(pessoas|amigas|amigos|convidad)/i,
  )?.[1];
  const discovery = isDiscoveryIntent(submitted || "");
  if (submitted !== null)
    return (
      <div className="intent-wrap intent-open">
        <div className="prompt-echo">
          <span className="eyebrow">SEU PEDIDO</span>
          <p>{submitted}</p>
          <button className="text-button" onClick={() => setSubmitted(null)}>
            Editar pedido
          </button>
        </div>
        {discovery ? (
          <section
            className="concierge-response"
            aria-label="Sugestões para descobrir Guarujá"
          >
            <span className="eyebrow">UM BOM COMEÇO</span>
            <h2>A cidade tem mais de um jeito de surpreender.</h2>
            <p>Praia, paisagem ou uma experiência preparada para você?</p>
            <div className="concierge-choices">
              <Link prefetch={false} href="/descobrir" className="choice-tile">
                <CityIcon name="descobrir" />
                <strong>Conhecer a cidade</strong>
                <span>Explore praias e pontos de interesse →</span>
              </Link>
              <button
                className="choice-tile"
                onClick={() => {
                  setIntent("Quero uma experiência no Guarujá");
                  setSubmitted("Quero uma experiência no Guarujá");
                }}
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
            intent={submitted}
            initialType={type}
            initialCategory={suggestCategory(submitted, type)}
            initialGuests={count ? Number(count) : undefined}
          />
        )}
      </div>
    );
  return (
    <div className="intent-wrap">
      <form
        className="intent-search"
        onSubmit={(e) => {
          e.preventDefault();
          if (intent.trim()) setSubmitted(intent.trim());
        }}
      >
        <label htmlFor="intencao">Conte pra gente</label>
        <div>
          <CityIcon name="spark" />
          <input
            id="intencao"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            maxLength={300}
            required
            placeholder="Ex.: uma experiência para 4 amigas na praia"
          />
          <button className="btn btn-primary" type="submit">
            Descomplicar <span aria-hidden>→</span>
          </button>
        </div>
      </form>
      <div className="intent-chips">
        <span>Ou comece por</span>
        {["Um momento a dois", "Limpeza da casa", "Preparar minha chegada"].map(
          (t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setIntent(t);
                setSubmitted(t);
              }}
            >
              {t} →
            </button>
          ),
        )}
      </div>
    </div>
  );
}
