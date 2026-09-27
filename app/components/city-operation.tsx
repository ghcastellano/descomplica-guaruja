"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { statuses, transitions, type CityStatus } from "@/lib/city-catalog";
export function CityOperation({
  id,
  version,
  status,
  experience,
  linked,
}: {
  id: string;
  version: number;
  status: CityStatus;
  experience: boolean;
  linked: string | null;
}) {
  const router = useRouter(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error);
      return data;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="card city-form">
      <h2>Próximo passo</h2>
      {experience && (
        <div className="soft-note">
          <p>
            Continue no fluxo existente de revisão, proposta e agenda de
            experiências.
          </p>
          {linked ? (
            <a href={"/atendimentos/" + linked} className="text-link">
              Abrir atendimento da experiência →
            </a>
          ) : (
            <button
              className="btn btn-secondary"
              disabled={busy || !transitions[status].length}
              onClick={async () => {
                const data = await call(
                  "/api/city/requests/" + id + "/experience",
                  "POST",
                );
                if (data) router.push("/atendimentos/" + data.id);
              }}
            >
              Preparar proposta de experiência →
            </button>
          )}
        </div>
      )}
      {transitions[status].length ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const data = await call("/api/city/requests/" + id, "PATCH", {
              version,
              status: f.get("status"),
              publicNote: f.get("publicNote"),
              internalNote: f.get("internalNote"),
            });
            if (data) router.refresh();
          }}
        >
          <label>
            Atualizar etapa
            <select required name="status" defaultValue="">
              <option value="" disabled>
                Escolha a próxima etapa
              </option>
              {transitions[status].map((s) => (
                <option key={s} value={s}>
                  {statuses[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Atualização que o cliente verá
            <textarea
              required
              name="publicNote"
              minLength={5}
              maxLength={1000}
              rows={3}
              placeholder="Explique o próximo passo com clareza."
            />
          </label>
          <label>
            Nota interna (só a equipe vê)
            <textarea name="internalNote" maxLength={2000} rows={3} />
          </label>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Salvando…" : "Registrar atualização"}
          </button>
          <p className="field-note">
            Atualiza o link de acompanhamento. Não envia WhatsApp ou e-mail.
          </p>
        </form>
      ) : (
        <p>Este pedido está encerrado. O histórico foi preservado.</p>
      )}
      {error && (
        <p role="alert" className="feedback">
          {error}
        </p>
      )}
    </div>
  );
}
