"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { worlds, suggestVertical, type Vertical } from "@/lib/city-catalog";
export function CityIntake({
  intent = "",
  initialType,
  initialCategory = "",
  initialGuests = 2,
}: {
  intent?: string;
  initialType?: Vertical;
  initialCategory?: string;
  initialGuests?: number;
}) {
  const router = useRouter(),
    key = useRef(""),
    heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [adjusting, setAdjusting] = useState(!initialCategory);
  const [type, setType] = useState<Vertical>(
    initialType || suggestVertical(intent),
  );
  const [category, setCategory] = useState(initialCategory),
    [description, setDescription] = useState(intent),
    [guests, setGuests] = useState(
      initialCategory === "A Dois"
        ? 2
        : Number.isInteger(initialGuests) &&
            initialGuests >= 2 &&
            initialGuests <= 8
          ? initialGuests
          : 2,
    );
  const [neighborhood, setNeighborhood] = useState(""),
    [date, setDate] = useState(""),
    [period, setPeriod] = useState("flexivel"),
    [name, setName] = useState(""),
    [contact, setContact] = useState(""),
    [consent, setConsent] = useState(false);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const titles = [
    "O que vamos descomplicar?",
    "Quando você precisa?",
    "E onde seria?",
    "Como podemos falar com você?",
    "Tudo certo para começar?",
  ];
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    if (busy) return;
    setBusy(true);
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const res = await fetch("/api/city/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestKey: key.current,
          vertical: type,
          category,
          description,
          neighborhood,
          preferredDate: date,
          period,
          name,
          contact,
          ...(type === "experiencias"
            ? { guests: category === "A Dois" ? 2 : guests }
            : {}),
          consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "Não foi possível enviar.");
      try {
        const old = JSON.parse(localStorage.getItem("dg-orders") || "[]");
        localStorage.setItem(
          "dg-orders",
          JSON.stringify(
            [
              { url: data.url, protocol: data.protocol },
              ...(Array.isArray(old) ? old : []).filter(
                (o: { url: string }) => o.url !== data.url,
              ),
            ].slice(0, 30),
          ),
        );
      } catch {}
      router.push(data.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="intake-layout">
      <aside className="intake-aside">
        <span className="eyebrow">VAMOS DESCOMPLICAR</span>
        <h1>
          Um começo simples.
          <br />
          Um cuidado de verdade.
        </h1>
        <p>
          Você conta o que precisa. A equipe avalia os detalhes antes de
          confirmar preço, profissional ou disponibilidade.
        </p>
        <ol className="step-list">
          {["Pedido", "Quando", "Onde", "Contato", "Revisão"].map((t, i) => (
            <li key={t} aria-current={step === i ? "step" : undefined}>
              <span>{i < step ? "✓" : i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
        <Link prefetch={false} href="/" className="text-link">
          ← Voltar ao início
        </Link>
      </aside>
      <form className="city-form card" onSubmit={submit}>
        <span className="eyebrow">PASSO {step + 1} DE 5</span>
        <h2 ref={heading} tabIndex={-1}>
          {titles[step]}
        </h2>
        {step === 0 && (
          <>
            {!adjusting && (
              <div className="intent-summary">
                <span>
                  <strong>{category}</strong>
                  <small>{worlds[type].title}</small>
                </span>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setAdjusting(true)}
                >
                  Ajustar
                </button>
              </div>
            )}
            {adjusting && (
              <>
                <label>
                  Como podemos ajudar?
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as Vertical);
                      setCategory("");
                      setGuests(2);
                    }}
                  >
                    {Object.entries(worlds).map(([v, w]) => (
                      <option key={v} value={v}>
                        {w.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {type === "parceiros"
                    ? "Sua área de atuação"
                    : "O que você procura?"}
                  <select
                    required
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (e.target.value === "A Dois") setGuests(2);
                    }}
                  >
                    <option value="">Selecione uma opção</option>
                    {worlds[type].categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {type === "experiencias" && (
              <label>
                Total de pessoas
                {category === "A Dois" ? (
                  <p className="field-note">
                    2 pessoas · exclusivo para o casal
                  </p>
                ) : (
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} pessoas
                      </option>
                    ))}
                  </select>
                )}
              </label>
            )}
            <label>
              {type === "parceiros"
                ? "Conte sobre seu trabalho"
                : "Conte um pouco mais"}
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === "parceiros"
                    ? "Quais serviços oferece? Como atende seus clientes?"
                    : "O que você gostaria que a gente soubesse?"
                }
              />
            </label>
          </>
        )}
        {step === 1 && (
          <>
            <p className="field-note">
              Escolha uma preferência. A confirmação vem depois da avaliação da
              equipe.
            </p>
            <div className="timing-options">
              {[
                ["", "Sou flexível"],
                [new Date().toLocaleDateString("en-CA"), "Hoje"],
                [
                  new Date(Date.now() + 86400000).toLocaleDateString("en-CA"),
                  "Amanhã",
                ],
              ].map(([value, label]) => (
                <button
                  className={date === value ? "selected" : ""}
                  type="button"
                  key={label}
                  aria-pressed={date === value}
                  onClick={() => setDate(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <label>
              Outra data (opcional)
              <input
                type="date"
                value={date}
                min={new Date().toLocaleDateString("en-CA")}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <details className="optional-details">
              <summary>Tenho preferência de período</summary>
              <label>
                Melhor período
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="flexivel">Sou flexível</option>
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde / pôr do sol</option>
                  <option value="noite">Noite</option>
                </select>
              </label>
            </details>
            <div className="soft-note">
              Ainda não é uma reserva de horário. Se houver urgência, não
              aguarde este pedido como atendimento emergencial.
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <label>
              {type === "parceiros"
                ? "Bairros onde atende"
                : "Bairro ou local de preferência"}
              <input
                required
                minLength={2}
                maxLength={100}
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Ex.: Astúrias, casa de veraneio"
              />
            </label>
            <p className="field-note">
              Só o bairro ou uma referência já ajuda. O endereço completo fica
              para o momento de combinar o atendimento.
            </p>
            {type === "experiencias" && (
              <div className="soft-note">
                Praia, casa ou hospedagem? Você pode indicar uma preferência.
                Espaços públicos dependem de avaliação e autorização.
              </div>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <label>
              Seu nome
              <input
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              WhatsApp ou e-mail
              <input
                required
                maxLength={150}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="(13) 99999-9999 ou seu@email.com"
              />
            </label>
            <label className="consent-field">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                Concordo com o uso destes dados para avaliar e acompanhar meu
                pedido, conforme a{" "}
                <Link prefetch={false} href="/privacidade" target="_blank">
                  política desta prévia
                </Link>
                .
              </span>
            </label>
            <p className="field-note">
              Você não precisa criar uma conta. Ao enviar, recebe um link
              privado para acompanhar.
            </p>
          </>
        )}
        {step === 4 && (
          <>
            <dl className="request-review">
              <div>
                <dt>Pedido</dt>
                <dd>
                  {worlds[type].title} · {category}
                  {type === "experiencias"
                    ? ` · ${category === "A Dois" ? 2 : guests} pessoas`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Detalhes</dt>
                <dd>{description}</dd>
              </div>
              <div>
                <dt>Local e momento</dt>
                <dd>
                  {neighborhood} · {date || "Data flexível"} ·{" "}
                  {
                    (
                      {
                        manha: "Manhã",
                        tarde: "Tarde",
                        noite: "Noite",
                        flexivel: "Período flexível",
                      } as Record<string, string>
                    )[period]
                  }
                </dd>
              </div>
              <div>
                <dt>Contato</dt>
                <dd>
                  {name}
                  <br />
                  {contact}
                </dd>
              </div>
            </dl>
            <div className="soft-note">
              {type === "parceiros"
                ? "Este envio registra seu interesse. Não cria contrato, aprovação ou anúncio."
                : "Você não será cobrado ao enviar. O atendimento e os valores serão combinados antes de qualquer contratação."}
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="feedback">
            {error}
          </p>
        )}
        <div className="form-actions">
          {step > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => {
                setStep(step - 1);
                setError("");
              }}
            >
              Voltar
            </button>
          )}
          <button className="btn btn-primary" disabled={busy}>
            {busy
              ? "Salvando seu pedido…"
              : step === 4
                ? "Enviar para avaliação →"
                : "Continuar →"}
          </button>
        </div>
      </form>
    </div>
  );
}
