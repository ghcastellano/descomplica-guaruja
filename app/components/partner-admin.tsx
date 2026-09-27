"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { partnerStatuses, type PartnerStatus } from "@/lib/service-catalog";
export function ProspectForm() {
  const router = useRouter(),
    key = useRef("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="concierge-response"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        const form = new FormData(e.currentTarget);
        key.current ||= crypto.randomUUID();
        try {
          const response = await fetch("/api/network/prospects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestKey: key.current,
              name: form.get("name"),
              contact: form.get("contact"),
              source: form.get("source"),
            }),
          });
          const data = await response.json();
          if (!response.ok) throw Error(data.error);
          router.push("/operacao/rede/" + data.id);
        } catch (e) {
          setError((e as Error).message);
          setBusy(false);
        }
      }}
    >
      <h2>Conheceu um bom profissional?</h2>
      <p>
        Registre a indicação para avaliar. Isso não cria perfil público nem
        envia convite.
      </p>
      <label>
        Nome profissional
        <input name="name" required minLength={2} maxLength={100} />
      </label>
      <label>
        Contato comercial
        <input name="contact" required maxLength={150} />
      </label>
      <label>
        Origem e contexto da indicação
        <textarea
          name="source"
          required
          minLength={5}
          maxLength={500}
          rows={2}
          placeholder="Quem indicou, fonte da informação e contexto em que foi obtida."
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Salvando…" : "Registrar indicação →"}
      </button>
    </form>
  );
}
export function PartnerReview({
  id,
  version,
  status,
  url,
}: {
  id: string;
  version: number;
  status: PartnerStatus;
  url: string;
}) {
  const router = useRouter();
  const options: Record<string, PartnerStatus[]> = {
    prospect: ["invited", "declined"],
    invited: ["declined"],
    pending: ["reviewing", "declined"],
    reviewing: ["qualified", "declined"],
  };
  const allowed = options[status] || [];
  const [next, setNext] = useState(allowed[0] || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  return (
    <>
      <section className="soft-note">
        <p>
          <strong>Perfil público: não publicado.</strong> Não há ativação
          comercial nesta etapa. A aceitação do cadastro não substitui o acordo
          de prestação.
        </p>
        {status === "invited" && (
          <>
            <p>
              O convite está pronto para compartilhar por um canal autorizado.
              Nenhuma mensagem foi enviada.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    new URL(url, window.location.origin).href,
                  );
                  setCopied(true);
                } catch {
                  setError(
                    "Não foi possível copiar. Abra o convite e copie o endereço.",
                  );
                }
              }}
            >
              {copied ? "Link copiado" : "Copiar link do convite"}
            </button>
            <a href={url} className="text-link" target="_blank">
              Abrir convite ↗
            </a>
          </>
        )}
      </section>
      {allowed.length > 0 && (
        <form
          className="concierge-response"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            const form = new FormData(e.currentTarget);
            try {
              const res = await fetch("/api/network/review/" + id, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  version,
                  status: next,
                  note: form.get("note"),
                  verified: form.get("verified") === "on",
                }),
              });
              const data = await res.json();
              if (!res.ok) throw Error(data.error);
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>Próximo passo</h2>
          <label>
            Etapa
            <select value={next} onChange={(e) => setNext(e.target.value as PartnerStatus)}>
              {allowed.map((s) => (
                <option key={s} value={s}>
                  {partnerStatuses[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Registro da avaliação
            <textarea
              name="note"
              required
              minLength={10}
              maxLength={1500}
              rows={3}
              placeholder="Registre o que foi verificado e o motivo da decisão. Visível somente à equipe."
            />
          </label>
          {next === "qualified" && (
            <label className="partner-check">
              <input name="verified" type="checkbox" required />
              <span>
                Confirmei a identidade/contato apresentado e as especialidades
                com o profissional. Registrei como fiz a verificação.
              </span>
            </label>
          )}
          {error && <p role="alert">{error}</p>}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Salvando…" : "Salvar avaliação"}
          </button>
        </form>
      )}
    </>
  );
}
