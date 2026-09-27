"use client";
import Link from "next/link";
import Image from "next/image";
import catalog from "@/lib/catalog.json";
import { priceWithStripe } from "@/lib/pricing";
import { CityIcon } from "./city-shell";
import { useEffect, useRef, useState } from "react";
import { worlds, suggestVertical, type Vertical } from "@/lib/city-catalog";
export function CityIntake({
  embedded = false,
  intent = "",
  initialType,
  initialCategory = "",
  initialGuests = 2,
}: {
  embedded?: boolean;
  intent?: string;
  initialType?: Vertical;
  initialCategory?: string;
  initialGuests?: number;
}) {
  const key = useRef(""),
    heading = useRef<HTMLHeadingElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(intent.trim().length < 10);
  const [result, setResult] = useState<{
    url: string;
    protocol: string;
  } | null>(null);
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
  }, [step, result]);
  const titles = [
    category
      ? type === "experiencias"
        ? "Um momento com a cara de vocês."
        : "Vamos cuidar disso com você."
      : "Por onde podemos começar?",
    "Que momento combina com você?",
    "Qual cenário você tem em mente?",
    "Para quem preparamos esse cuidado?",
    "Seu pedido, do seu jeito.",
  ];
  const selectedGuests = category === "A Dois" ? 2 : guests;
  const firstPackage = Object.entries(catalog.packages).find(
    ([, p]) => p.col === category,
  );
  const price = firstPackage
    ? (catalog.prices as Record<string, Record<string, number[]>>)[
        firstPackage[0]
      ][String(selectedGuests)]
    : undefined;
  const estimated = price
    ?.map((n) =>
      Math.ceil(priceWithStripe(n * 100) / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }),
    )
    .join(" – ");
  const photos: Record<string, string> = {
    "A Dois": "casal-por-do-sol-col-800.webp",
    Celebrar: "experiencia-flores-col-800.webp",
    "Entre Amigas": "experiencia-boho-praia-col-800.webp",
    Pedido: "pedido-casamento-praia-col-800.webp",
  };
  const sufficientDescription = description.trim().length >= 10;
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
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  if (result)
    return (
      <section className="concierge-response" aria-label="Pedido recebido">
        <span className="eyebrow">{result.protocol} · PEDIDO RECEBIDO</span>
        <h2 ref={heading} tabIndex={-1}>
          Sua ideia já tem um próximo passo.
        </h2>
        <p>
          A equipe vai avaliar os detalhes e preparar o próximo contato. Nenhuma
          reserva ou cobrança foi feita.
        </p>
        <p className="soft-note">
          Guarde o link de acompanhamento. É por ele que você verá as
          atualizações e a proposta quando estiver pronta.
        </p>
        <Link prefetch={false} className="btn btn-primary" href={result.url}>
          Acompanhar meu pedido →
        </Link>
      </section>
    );
  return (
    <div className={"concierge-widget" + (embedded ? " embedded" : "")}>
      {!embedded && (
        <header className="concierge-intro">
          <Link prefetch={false} href="/" className="text-link">
            ← Voltar ao início
          </Link>
          <h1>Vamos dar forma à sua ideia.</h1>
          {intent && <p className="prompt-echo">{intent}</p>}
        </header>
      )}
      <form className="concierge-response" onSubmit={submit}>
        <div className="concierge-signature">
          <CityIcon name="spark" />
          <span>
            DESCOMPLICA <small>Um cuidado de cada vez</small>
          </span>
        </div>
        {step > 0 && (
          <div className="concierge-context" aria-label="Seu pedido até aqui">
            <button type="button" disabled={busy} onClick={() => setStep(0)}>
              {category}
              {type === "experiencias"
                ? ` · ${selectedGuests} pessoas`
                : ""}{" "}
              <span aria-hidden>✎</span>
            </button>
            {step > 1 && (
              <button type="button" disabled={busy} onClick={() => setStep(1)}>
                {date ? date.split("-").reverse().join("/") : "Data flexível"}{" "}
                <span aria-hidden>✎</span>
              </button>
            )}
            {step > 2 && (
              <button type="button" disabled={busy} onClick={() => setStep(2)}>
                {neighborhood} <span aria-hidden>✎</span>
              </button>
            )}
          </div>
        )}
        <h2 ref={heading} tabIndex={-1}>
          {titles[step]}
        </h2>
        {step === 0 && (
          <>
            {!adjusting && (
              <>
                <div className="concierge-match">
                  {photos[category] ? (
                    <Image
                      src={"/img/" + photos[category]}
                      alt={"Cenário da coleção " + category}
                      width={800}
                      height={500}
                      sizes="(max-width:600px) 90vw, 300px"
                    />
                  ) : (
                    <div className="concierge-match-symbol">
                      <CityIcon name={type} />
                    </div>
                  )}
                  <div>
                    <span className="eyebrow">
                      {type === "experiencias"
                        ? "DO NOSSO CATÁLOGO"
                        : "ATENDIMENTO SOB AVALIAÇÃO"}
                    </span>
                    <h3>{category}</h3>
                    <p>{worlds[type].description}</p>
                    {estimated && (
                      <>
                        <strong className="concierge-price">{estimated}</strong>
                        <small>
                          {firstPackage![1].tier} · estimativa para{" "}
                          {selectedGuests} pessoas. Valor final na proposta.
                        </small>
                      </>
                    )}
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setAdjusting(true)}
                    >
                      Escolher outra opção →
                    </button>
                  </div>
                </div>
                {estimated && (
                  <p className="field-note">
                    Montagem, desmontagem e transporte urbano incluídos.
                    Locação, acessos especiais e extras à parte.
                  </p>
                )}
              </>
            )}
            {adjusting && (
              <div className="concierge-options">
                <p>Escolha o caminho que faz sentido para o seu pedido.</p>
                <div
                  className="concierge-pills"
                  aria-label="Como podemos ajudar?"
                >
                  {Object.entries(worlds).map(([v, w]) => (
                    <button
                      type="button"
                      key={v}
                      aria-pressed={type === v}
                      onClick={() => {
                        setType(v as Vertical);
                        setCategory("");
                        setGuests(2);
                      }}
                    >
                      {w.title}
                    </button>
                  ))}
                </div>
                <div
                  className="concierge-choices"
                  aria-label="O que você procura?"
                >
                  {worlds[type].categories.map((c) => (
                    <button
                      className="choice-tile"
                      type="button"
                      key={c}
                      aria-pressed={category === c}
                      onClick={() => {
                        setCategory(c);
                        if (c === "A Dois") setGuests(2);
                        setAdjusting(false);
                      }}
                    >
                      <strong>{c}</strong>
                      <span>Explorar esta opção →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {type === "experiencias" && category && (
              <fieldset className="concierge-count">
                <legend>Quantas pessoas vão viver esse momento?</legend>
                {category === "A Dois" ? (
                  <p className="field-note">
                    2 pessoas · exclusivo para o casal
                  </p>
                ) : (
                  <div
                    className="concierge-pills"
                    aria-label="Total de pessoas"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <button
                        type="button"
                        key={n}
                        aria-pressed={guests === n}
                        onClick={() => setGuests(n)}
                      >
                        {n} pessoas
                      </button>
                    ))}
                  </div>
                )}
              </fieldset>
            )}
            <details
              className="concierge-details"
              open={detailsOpen}
              onToggle={(e) => setDetailsOpen(e.currentTarget.open)}
            >
              <summary>
                {sufficientDescription
                  ? "Acrescentar ou ajustar detalhes"
                  : "Conte um pouco sobre a sua ideia"}
              </summary>
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
            </details>
          </>
        )}
        {step === 1 && (
          <>
            <p className="field-note">
              Escolha uma preferência. A confirmação vem depois da avaliação da
              equipe.
            </p>
            <div className="concierge-pills">
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
            <fieldset className="concierge-count">
              <legend>Tem um período favorito?</legend>
              <div className="concierge-pills">
                {[
                  ["flexivel", "Sou flexível"],
                  ["manha", "Manhã"],
                  ["tarde", "Tarde"],
                  ...(type === "experiencias"
                    ? [["por-do-sol", "Pôr do sol"]]
                    : []),
                  ["noite", "Noite"],
                ].map(([v, l]) => (
                  <button
                    type="button"
                    key={v}
                    aria-pressed={period === v}
                    onClick={() => setPeriod(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="soft-note">
              Ainda não é uma reserva de horário. Se houver urgência, não
              aguarde este pedido como atendimento emergencial.
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="concierge-pills" aria-label="Sugestões de local">
              {[
                "Astúrias",
                "Tombo",
                "Pitangueiras",
                "Enseada",
                "Quero ajuda para escolher",
              ].map((place) => (
                <button
                  type="button"
                  key={place}
                  aria-pressed={neighborhood === place}
                  onClick={() => setNeighborhood(place)}
                >
                  {place}
                </button>
              ))}
            </div>
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
                        "por-do-sol": "Pôr do sol",
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
          <button
            className="btn btn-primary"
            disabled={
              busy || (step === 0 && (!category || !sufficientDescription))
            }
          >
            {busy
              ? "Salvando seu pedido…"
              : step === 4
                ? "Enviar para avaliação →"
                : step === 0
                  ? "Continuar com a ideia →"
                  : "Continuar →"}
          </button>
        </div>
      </form>
    </div>
  );
}
