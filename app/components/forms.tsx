"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { paymentEstimate } from "@/lib/pricing";
import catalog from "@/lib/catalog.json";
import { sources } from "@/lib/sources";
async function send(url: string, body: unknown, method = "POST") {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Não foi possível salvar.");
  return result;
}
function Feedback({ message }: { message: string }) {
  return message ? (
    <p className="feedback" role="alert">
      {message}
    </p>
  ) : null;
}
export function Login() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await send("/api/login", {
            code: new FormData(e.currentTarget).get("code"),
          });
          window.location.assign("/operacao");
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Código de acesso da equipe
        <input
          name="code"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
        />
      </label>
      <Feedback message={error} />
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Entrando…" : "Entrar na operação →"}
      </button>
      <p className="muted">
        Use o código da equipe compartilhado por Gustavo. A sessão dura 8 horas.
      </p>
    </form>
  );
}
export function Logout() {
  const router = useRouter();
  return (
    <button
      className="text-button"
      onClick={async () => {
        await send("/api/logout", {});
        router.push("/login");
        router.refresh();
      }}
    >
      Sair
    </button>
  );
}
export function Intake({
  requestId,
  initial,
}: {
  requestId?: string;
  initial?: { name: string; contact: string; notes: string; source: string;
    guests?: number; place?: string; period?: string; collection?: string; preferredDate?: string };
} = {}) {
  const router = useRouter(),
    key = useRef("");
  const [pkg, setPkg] = useState(requestId ? "" : "adois_ess"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const couple = pkg.startsWith("adois_");
  return (
    <form
      className="paper card"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const f = new FormData(e.currentTarget);
        if (!key.current) key.current = crypto.randomUUID();
        try {
          const result = await send(
            requestId ? `/api/inquiries/${requestId}` : "/api/requests",
            {
              requestKey: key.current,
              source: initial?.source || f.get("source"),
              name: f.get("name"),
              contact: f.get("contact"),
              packageId: pkg,
              guests: couple ? 2 : Number(f.get("guests")),
              location: f.get("location"),
              place: f.get("place"),
              period: f.get("period"),
              budget: Number(f.get("budget")),
              notes: f.get("notes"),
            },
          );
          router.push("/propostas/" + result.id);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {initial?.collection && (
        <div className="soft-note">
          <strong>Preferência do cliente: {initial.collection} · {initial.guests} pessoas</strong>
          <p>{initial.preferredDate ? `Data desejada: ${initial.preferredDate.split("-").reverse().join("/")}. ` : "Data flexível. "}
            Escolha o nível da experiência após revisar os detalhes. A data ainda não está reservada.</p>
        </div>
      )}
      {!requestId && (
        <label>
          Origem do atendimento
          <select name="source" defaultValue="outro">
            {Object.entries(sources).map(([id, label]) => (
              <option value={id} key={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="section-title">
        <span>01</span>
        <h2>Quem e qual momento?</h2>
      </div>
      <div className="form-grid">
        <label>
          Nome fictício
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            defaultValue={initial?.name || "Cliente de demonstração"}
          />
        </label>
        <label>
          Contato fictício
          <input
            name="contact"
            required
            maxLength={150}
            defaultValue={initial?.contact || "cliente@example.invalid"}
          />
        </label>
        <label>
          Experiência
          <select
            name="packageId"
            required
            value={pkg}
            onChange={(e) => setPkg(e.target.value)}
          >
            {requestId && (
              <option value="" disabled>
                Escolha a experiência
              </option>
            )}
            {Object.entries(catalog.packages).map(([id, p]) => (
              <option value={id} key={id}>
                {p.col} · {p.tier}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pessoas
          <select
            name="guests"
            key={String(couple)}
            disabled={couple}
            required
            defaultValue={couple ? "2" : initial?.guests ?? (requestId ? "" : "2")}
          >
            {requestId && !couple && (
              <option value="" disabled>
                Defina a quantidade
              </option>
            )}
            {(couple ? [2] : [2, 3, 4, 5, 6, 7, 8]).map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <small>
            {couple
              ? "A Dois é exclusivo para o casal."
              : "De 2 a 8 pessoas, incluindo quem celebra."}
          </small>
        </label>
      </div>
      <div className="section-title">
        <span>02</span>
        <h2>Onde a história acontece?</h2>
      </div>
      <div className="form-grid">
        <label>
          Preferência de local
          <select name="location" defaultValue={requestId ? "ajuda" : "praia"}>
            <option value="praia">Na praia</option>
            <option value="casa">Na hospedagem ou em casa</option>
            <option value="ajuda">Quero ajuda para escolher</option>
          </select>
        </label>
        <label>
          <span>Local em mente <small>(opcional)</small></span>
          <input
            name="place"
            defaultValue={initial?.place || ""}
            maxLength={150}
            placeholder="Uma praia, casa ou hospedagem"
          />
        </label>
        <label>
          Período
          <select
            name="period"
            defaultValue={initial?.period || (requestId ? "flexivel" : "por-do-sol")}
          >
            <option value="por-do-sol">Pôr do sol</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
            <option value="flexivel">Ainda não definido / flexível</option>
          </select>
        </label>
        <label>
          Expectativa de orçamento (R$)
          <input
            name="budget"
            aria-describedby="intake-budget-help"
            type="number"
            min="0"
            max="1000000"
            step="1"
            defaultValue={requestId ? "0" : "1000"}
            required
          />
          <small id="intake-budget-help">Use 0 se ainda não foi informado.</small>
        </label>
      </div>
      <label>
        <span>O que devemos saber? <small>(opcional)</small></span>
        <textarea
          name="notes"
          defaultValue={initial?.notes || ""}
          rows={3}
          maxLength={3000}
          placeholder="Conte a intenção e os cuidados especiais. Use somente dados fictícios."
        />
      </label>
      <div className="notice">
        Preferência de local e período não reserva uma data. Todos os locais
        ainda precisam de avaliação.
      </div>
      <Feedback message={error} />
      <button className="btn btn-primary" disabled={busy}>
        {busy
          ? "Registrando…"
          : requestId
            ? "Preparar proposta neste atendimento →"
            : "Criar solicitação de teste →"}
      </button>
      <p className="muted">
        O rascunho usa a média do catálogo ajustada para as tarifas de sinal e
        saldo no Stripe. Sophia revisa antes de liberar.
      </p>
    </form>
  );
}
type Revision = {
  amountCents: number;
  durationMinutes?: number | null;
  items: string[];
  clientNote: string;
  internalNote: string;
};
export function Review({
  id,
  version,
  status,
  revision,
}: {
  id: string;
  version: number;
  status: string;
  revision: Revision;
}) {
  const router = useRouter(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [checked, setChecked] = useState(false),
    [amount, setAmount] = useState(revision.amountCents);
  async function release() {
    setBusy(true);
    setError("");
    try {
      await send(`/api/proposals/${id}/release`, { version });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="paper card">
      <form
        onChange={() => {
          setDirty(true);
          setChecked(false);
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          setError("");
          try {
            await send(
              `/api/proposals/${id}`,
              {
                version,
                revision: {
                  amountCents: Math.round(Number(f.get("amount")) * 100),
                  durationMinutes: f.get("duration")
                    ? Number(f.get("duration"))
                    : null,
                  items: String(f.get("items"))
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  clientNote: f.get("clientNote"),
                  internalNote: f.get("internalNote"),
                },
              },
              "PUT",
            );
            setDirty(false);
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="section-title">
          <span>02</span>
          <h2>Revise a proposta</h2>
        </div>
        <label>
          Valor total da experiência (R$)
          <input
            name="amount"
            type="number"
            min="1"
            max="1000000"
            step="0.01"
            defaultValue={(revision.amountCents / 100).toFixed(2)}
            onChange={(e) =>
              setAmount(Math.round(Number(e.target.value) * 100))
            }
            required
          />
        </label>
        {amount >= 100 && Number.isSafeInteger(amount) && (
          <div className="fee-estimate">
            <strong>Composição interna · cartão nacional</strong>
            <p>
              Sinal e saldo: duas cobranças. Tarifa estimada total de{" "}
              {(paymentEstimate(amount).feesCents / 100).toLocaleString(
                "pt-BR",
                { style: "currency", currency: "BRL" },
              )}
              , já dentro do valor informado. Líquido após Stripe:{" "}
              {(paymentEstimate(amount).netCents / 100).toLocaleString(
                "pt-BR",
                { style: "currency", currency: "BRL" },
              )}
              , antes dos demais custos.
            </p>
            <small>
              Base: 3,99% + R$ 0,39 por cobrança. Cartão internacional pode
              custar mais. Alterar o preço não recalcula automaticamente sua
              margem. Propostas antigas mantêm o valor aprovado.
            </small>
          </div>
        )}
        <label>
          Duração da experiência (minutos)
          <input
            name="duration"
            type="number"
            min="30"
            max="360"
            step="15"
            defaultValue={revision.durationMinutes ?? ""}
            placeholder="Defina antes de liberar a agenda"
          />
          <small>
            A agenda inclui também preparação e desmontagem. Pedido sob medida
            precisa de duração revisada.
          </small>
        </label>
        <label>
          O que está incluído <small>Um item por linha</small>
          <textarea
            name="items"
            defaultValue={revision.items.join("\n")}
            rows={5}
            required
            maxLength={15000}
          />
        </label>
        <label>
          Recado para o cliente
          <textarea
            name="clientNote"
            defaultValue={revision.clientNote}
            rows={3}
            maxLength={2000}
          />
        </label>
        <label className="internal">
          Nota interna · só a equipe vê
          <textarea
            name="internalNote"
            defaultValue={revision.internalNote}
            rows={4}
            maxLength={3000}
          />
        </label>
        <Feedback message={error} />
        <button className="btn btn-secondary" disabled={busy || !dirty}>
          {busy ? "Salvando…" : "Salvar revisão"}
        </button>
        {dirty && (
          <p className="muted">
            Salve as mudanças antes de liberar. Uma revisão cancela os links
            anteriores.
          </p>
        )}
      </form>
      <div className="release">
        <span className="eyebrow">03 / LIBERAÇÃO EXPLÍCITA</span>
        {status === "released" ? (
          <p>
            Esta versão já tem um link de teste. A mensagem simulada aparece
            abaixo.
          </p>
        ) : (
          <>
            <h2>Pronta para o cliente?</h2>
            <label className="check">
              <input
                type="checkbox"
                checked={checked}
                disabled={dirty}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <span>
                Revisei o valor e os itens desta versão. Quero gerar o link de
                teste.
              </span>
            </label>
            <button
              className="btn btn-primary"
              disabled={busy || dirty || !checked}
              onClick={release}
            >
              Liberar proposta de teste →
            </button>
            <p className="muted">Nenhum WhatsApp ou e-mail será enviado.</p>
          </>
        )}
      </div>
    </div>
  );
}
export function CopyMessage({ text }: { text: string }) {
  const [label, setLabel] = useState("Copiar mensagem simulada");
  return (
    <button
      className="btn btn-secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setLabel("Copiada");
        } catch {
          setLabel("Selecione e copie o texto acima.");
        }
      }}
    >
      {label}
    </button>
  );
}
