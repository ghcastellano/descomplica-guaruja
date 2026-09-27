"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { isDiscoveryIntent } from "@/lib/city-catalog";
import { CityIcon } from "./city-shell";
export function IntentSearch() {
  const [intent, setIntent] = useState("");
  const router = useRouter();
  return (
    <div className="intent-wrap">
      <form
        className="intent-search"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(
            isDiscoveryIntent(intent)
              ? "/descobrir"
              : "/descomplicar?pedido=" + encodeURIComponent(intent),
          );
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
            placeholder="Ex.: preciso de uma limpeza no sábado"
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
              onClick={() =>
                router.push("/descomplicar?pedido=" + encodeURIComponent(t))
              }
            >
              {t} ↗
            </button>
          ),
        )}
      </div>
    </div>
  );
}
