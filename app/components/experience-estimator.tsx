"use client";
import { useState } from "react";
import Link from "next/link";
import catalog from "@/lib/catalog.json";
import { priceWithStripe } from "@/lib/pricing";
export function ExperienceEstimator() {
  const [collection, setCollection] = useState("A Dois"),
    [guests, setGuests] = useState(2);
  const money = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(Math.ceil(priceWithStripe(n * 100) / 100));
  return (
    <section className="city-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ESCOLHAS CLARAS, DESDE O COMEÇO</span>
          <h2>Imagine o momento. Conheça a estimativa.</h2>
        </div>
      </div>
      <div className="estimator-controls">
        <label>
          Coleção
          <select
            value={collection}
            onChange={(e) => {
              setCollection(e.target.value);
              if (e.target.value === "A Dois") setGuests(2);
            }}
          >
            {["A Dois", "Celebrar", "Entre Amigas", "Pedido"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Total de pessoas
          <select
            disabled={collection === "A Dois"}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          >
            {(collection === "A Dois" ? [2] : [2, 3, 4, 5, 6, 7, 8]).map(
              (n) => (
                <option key={n} value={n}>
                  {n} pessoas
                </option>
              ),
            )}
          </select>
        </label>
      </div>
      <div className="service-grid">
        {Object.entries(catalog.packages)
          .filter(([, p]) => p.col === collection)
          .map(([id, p]) => {
            const range = (
              catalog.prices as Record<string, Record<string, number[]>>
            )[id][String(guests)];
            return (
              <article className="service-card" key={id}>
                <span className="eyebrow">
                  {p.col} · {guests} PESSOAS
                </span>
                <h3>{p.tier}</h3>
                <p className="estimate-amount">
                  {money(range[0])} – {money(range[1])}
                </p>
                <ul>
                  {p.inc.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <Link prefetch={false}
                  className="text-link"
                  href={
                    "/descomplicar?tipo=experiencias&categoria=" +
                    encodeURIComponent(collection) +
                    "&pessoas=" +
                    guests +
                    "&pedido=" +
                    encodeURIComponent(
                      `Gostaria da experiência ${p.col} ${p.tier} para ${guests} pessoas.`,
                    )
                  }
                >
                  Planejar esta experiência →
                </Link>
              </article>
            );
          })}
      </div>
      <p className="field-note">
        Estimativas para o grupo inteiro, com custos de pagamento considerados.
        Variam conforme detalhes e disponibilidade; a equipe confirma o valor na
        proposta. Transporte urbano, montagem e desmontagem incluídos. Locação,
        acessos especiais e extras à parte.
      </p>
    </section>
  );
}
