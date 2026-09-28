"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { partnerStatuses, type PartnerStatus } from "@/lib/service-catalog";
import Link from "next/link";

export function ProspectResearch() {
  const [specialty, setSpecialty] = useState("Limpeza"),
    [area, setArea] = useState("");
  const query = `${specialty} ${area} Guarujá contato comercial`.trim();
  return (
    <section className="prospect-research">
      <div>
        <span className="eyebrow">BUSCA ATIVA</span>
        <h2>Encontre quem já atende na cidade.</h2>
        <p>
          Pesquise negócios, confira a fonte e salve os que fazem sentido para a
          rede.
        </p>
      </div>
      <div className="form-grid">
        <label>
          Serviço ou especialidade
          <input
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            maxLength={80}
          />
        </label>
        <label>
          <span>
            Bairro <small>(opcional)</small>
          </span>
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            maxLength={80}
            placeholder="Ex.: Tombo"
          />
        </label>
      </div>
      <div className="actions">
        <a
          className="btn btn-secondary"
          href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
          target="_blank"
          rel="noreferrer"
        >
          Pesquisar negócios ↗
        </a>
        <a className="text-link" href="#novo-negocio">
          Já encontrei um negócio →
        </a>
      </div>
      <p className="field-note">
        A pesquisa abre em outra aba. Guarde o endereço da fonte ao adicionar um
        negócio.
      </p>
    </section>
  );
}

export function PartnerList({
  rows,
}: {
  rows: { id: string; name: string; protocol: string; status: PartnerStatus }[];
}) {
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("");
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (!status || r.status === status) &&
      normalize(r.name + " " + r.protocol).includes(normalize(query)),
  );
  return (
    <section>
      <h2>Negócios e profissionais</h2>
      <div className="form-grid">
        <label>
          Buscar na rede
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome ou protocolo"
          />
        </label>
        <label>
          Etapa
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(partnerStatuses).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="field-note" role="status">
        {filtered.length} de {rows.length} registros
      </p>
      <div className="inbox">
        {filtered.map((r) => (
          <Link
            href={"/operacao/rede/" + r.id}
            className="inbox-row"
            key={r.id}
          >
            <div>
              <span className="eyebrow">{r.protocol}</span>
              <h3>{r.name}</h3>
            </div>
            <span className="badge">{partnerStatuses[r.status]} →</span>
          </Link>
        ))}
      </div>
      {!filtered.length && (
        <p className="soft-note">
          {rows.length
            ? "Nenhum resultado com estes filtros. Tente outro nome ou etapa."
            : "Comece por um negócio encontrado na pesquisa ou uma indicação."}
        </p>
      )}
    </section>
  );
}
export function ProspectForm() {
  const router = useRouter(),
    key = useRef("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="concierge-response"
      id="novo-negocio"
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
      <h2>Adicionar um negócio</h2>
      <p>
        Salve o contato e a fonte. Depois, prepare o convite na ficha do
        negócio.
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
        Fonte e contexto
        <textarea
          name="source"
          required
          minLength={5}
          maxLength={500}
          rows={2}
          placeholder="Cole o link do site ou perfil comercial e o serviço que encontrou. Se foi indicação, registre quem indicou."
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Salvando…" : "Salvar negócio →"}
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
              Convite preparado. Copie a mensagem para compartilhar com quem
              aceitou conversar sobre a parceria.
            </p>
            <blockquote className="invite-draft">
              Olá! Somos da Descomplica Guarujá e estamos conhecendo
              profissionais e negócios da cidade. Gostaríamos de conversar sobre
              uma possível parceria. Neste link você pode apresentar seu
              trabalho e escolher como participar.
            </blockquote>
            <div className="actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      "Olá! Somos da Descomplica Guarujá e estamos conhecendo profissionais e negócios da cidade. Gostaríamos de conversar sobre uma possível parceria. Neste link você pode apresentar seu trabalho e escolher como participar: " +
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
                {copied ? "Mensagem copiada" : "Copiar mensagem de convite"}
              </button>
              <a href={url} className="text-link" target="_blank">
                Abrir convite ↗
              </a>
            </div>
            <p className="field-note">
              Nenhuma mensagem foi enviada. Este convite é da homologação.
            </p>
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
            <select
              value={next}
              onChange={(e) => setNext(e.target.value as PartnerStatus)}
            >
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
