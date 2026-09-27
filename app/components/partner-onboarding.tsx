"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  services,
  partnerTerms,
  partnerStatuses,
  type PartnerStatus,
} from "@/lib/service-catalog";
export function PartnerOnboarding({
  token,
  version = 1,
}: {
  token?: string;
  version?: number;
}) {
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [name, setName] = useState(""),
    [contact, setContact] = useState(""),
    [ids, setIds] = useState<string[]>([]),
    [areas, setAreas] = useState(""),
    [availability, setAvailability] = useState(""),
    [description, setDescription] = useState("");
  const [accepted, setAccepted] = useState(false),
    [adult, setAdult] = useState(false),
    [publish, setPublish] = useState(false),
    [whatsapp, setWhatsapp] = useState(false);
  const [result, setResult] = useState<{
    protocol: string;
    url: string;
  } | null>(null);
  const key = useRef("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step, result]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (step === 0 && !ids.length) {
      setError("Escolha ao menos um serviço.");
      return;
    }
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    if (busy) return;
    setBusy(true);
    key.current ||= crypto.randomUUID();
    try {
      const response = await fetch("/api/network/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestKey: key.current,
          ...(token ? { token } : {}),
          name,
          contact,
          serviceIds: ids,
          areas,
          availability,
          description,
          accepted,
          adult,
          termsVersion: partnerTerms.version,
          publishPermission: publish,
          whatsappPermission: whatsapp,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error || "Não foi possível registrar.");
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (result)
    return (
      <section className="concierge-response" role="status">
        <span className="eyebrow">{result.protocol}</span>
        <h2 ref={heading} tabIndex={-1}>
          Seu trabalho merece ser conhecido.
        </h2>
        <p>
          Recebemos seu cadastro para avaliação. Guarde o link privado para
          acompanhar e gerenciar suas autorizações.
        </p>
        <Link href={result.url} className="btn btn-primary">
          Acompanhar meu cadastro →
        </Link>
      </section>
    );
  return (
    <form className="concierge-response partner-form" onSubmit={submit}>
      <div className="concierge-signature">
        <span className="eyebrow">REDE LOCAL · {step + 1} DE 3</span>
      </div>
      <h2 ref={heading} tabIndex={-1}>
        {
          [
            "O que você faz de melhor?",
            "Vamos conhecer seu atendimento.",
            "Seu cadastro, suas escolhas.",
          ][step]
        }
      </h2>
      {step === 0 && (
        <>
          <label>
            Nome profissional ou do negócio
            <input
              required
              minLength={2}
              maxLength={100}
              autoComplete="organization"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Telefone ou e-mail para contato
            <input
              required
              maxLength={150}
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                if (e.target.value.includes("@")) setWhatsapp(false);
              }}
              autoComplete="email"
            />
          </label>
          <fieldset>
            <legend>Quais serviços você realiza?</legend>
            {[
              ...new Set(
                services.map((s) =>
                  s.vertical === "casa" ? "Casa e veraneio" : s.category,
                ),
              ),
              "Outro serviço",
            ].map((group) => (
              <details className="partner-service-group" key={group}>
                <summary>
                  {group}{" "}
                  <small>
                    {ids.filter((id) =>
                      group === "Outro serviço"
                        ? id === "outro"
                        : services.some(
                            (s) =>
                              s.id === id &&
                              (s.vertical === "casa"
                                ? "Casa e veraneio"
                                : s.category) === group,
                          ),
                    ).length || ""}
                  </small>
                </summary>
                <div className="partner-service-options">
                  {(group === "Outro serviço"
                    ? [
                        {
                          id: "outro",
                          name: "Meu serviço é outro — vou explicar",
                        },
                      ]
                    : services.filter(
                        (s) =>
                          (s.vertical === "casa"
                            ? "Casa e veraneio"
                            : s.category) === group,
                      )
                  ).map((s) => (
                    <label className="partner-check" key={s.id}>
                      <input
                        type="checkbox"
                        checked={ids.includes(s.id)}
                        disabled={!ids.includes(s.id) && ids.length >= 12}
                        onChange={(e) =>
                          setIds((old) =>
                            e.target.checked
                              ? [...old, s.id]
                              : old.filter((id) => id !== s.id),
                          )
                        }
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </details>
            ))}
          </fieldset>
        </>
      )}
      {step === 1 && (
        <>
          <label>
            Bairros e regiões em que atende
            <input
              required
              minLength={3}
              maxLength={300}
              value={areas}
              onChange={(e) => setAreas(e.target.value)}
              placeholder="Ex.: Tombo, Astúrias e Pitangueiras"
            />
          </label>
          <label>
            Quando costuma atender?
            <input
              required
              minLength={3}
              maxLength={300}
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="Ex.: dias úteis, manhã e tarde"
            />
          </label>
          <label>
            Conte sobre seu trabalho
            <textarea
              required
              minLength={10}
              maxLength={1500}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Experiência, especialidades e como costuma preparar o orçamento. Não envie documentos ou dados de clientes."
            />
          </label>
        </>
      )}
      {step === 2 && (
        <>
          <div className="soft-note">
            <strong>{name}</strong>
            <p>
              {ids
                .map(
                  (id) =>
                    services.find((s) => s.id === id)?.name || "Outro serviço",
                )
                .join(" · ")}
            </p>
            <p>
              {areas} · {availability}
            </p>
            <p>
              Esta é uma avaliação inicial, sem taxa de cadastro e sem garantia
              de contratação.
            </p>
          </div>
          <details className="partner-terms" open>
            <summary>{partnerTerms.title}</summary>
            {partnerTerms.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <small>Versão {partnerTerms.version}</small>
          </details>
          <label className="partner-check">
            <input
              type="checkbox"
              required
              checked={adult}
              onChange={(e) => setAdult(e.target.checked)}
            />
            <span>
              Tenho 18 anos ou mais e posso representar o negócio informado.
            </span>
          </label>
          <label className="partner-check">
            <input
              type="checkbox"
              required
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              Li e aceito os termos de cadastro para avaliação e estou ciente da{" "}
              <Link href="/privacidade" target="_blank">
                política de privacidade
              </Link>
              .
            </span>
          </label>
          <label className="partner-check">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
            />
            <span>
              <strong>Opcional:</strong> autorizo a divulgação do meu perfil,
              depois da aprovação e das condições comerciais definidas.
            </span>
          </label>
          <label className="partner-check">
            <input
              type="checkbox"
              checked={whatsapp}
              disabled={!/^\+?[\d ()-]{10,20}$/.test(contact)}
              onChange={(e) => setWhatsapp(e.target.checked)}
            />
            <span>
              <strong>Opcional:</strong> quero receber oportunidades e
              atualizações do cadastro pelo WhatsApp. Posso cancelar essa
              permissão.
            </span>
          </label>
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
            onClick={() => setStep(step - 1)}
          >
            Voltar
          </button>
        )}
        <button className="btn btn-primary" disabled={busy}>
          {busy
            ? "Registrando…"
            : step === 2
              ? "Aceitar e enviar cadastro →"
              : "Continuar →"}
        </button>
      </div>
      {token ? (
        <PartnerPreferences
          token={token}
          version={version}
          status="invited"
          publishPermission={false}
          whatsappPermission={false}
          declineOnly
        />
      ) : (
        <Link href="/" className="text-link">
          Prefiro não me cadastrar agora
        </Link>
      )}
    </form>
  );
}
export function PartnerPreferences({
  token,
  version,
  status,
  publishPermission,
  whatsappPermission,
  declineOnly = false,
}: {
  token: string;
  version: number;
  status: PartnerStatus;
  publishPermission: boolean;
  whatsappPermission: boolean;
  declineOnly?: boolean;
}) {
  const [publish, setPublish] = useState(publishPermission),
    [whatsapp, setWhatsapp] = useState(whatsappPermission),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  async function save(withdraw: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/network/permissions/" + token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          withdraw,
          publishPermission: publish,
          whatsappPermission: whatsapp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error);
      window.location.assign("/rede/" + token);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  if (["withdrawn", "declined"].includes(status))
    return (
      <p className="soft-note">
        {partnerStatuses[status]}. Este cadastro não está ativo na rede.
      </p>
    );
  return (
    <section className="partner-permissions" aria-label="Suas autorizações">
      {!declineOnly && (
        <>
          <h2>Você mantém o controle.</h2>
          <label className="partner-check">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
            />
            <span>
              Permitir divulgação do perfil após aprovação e definição das
              condições comerciais.
            </span>
          </label>
          <label className="partner-check">
            <input
              type="checkbox"
              checked={whatsapp}
              onChange={(e) => setWhatsapp(e.target.checked)}
            />
            <span>Receber oportunidades e atualizações pelo WhatsApp.</span>
          </label>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => save(false)}
          >
            Salvar preferências
          </button>
        </>
      )}
      {!confirm ? (
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={() => setConfirm(true)}
        >
          {declineOnly ? "Não quero participar" : "Encerrar minha participação"}
        </button>
      ) : (
        <div className="soft-note">
          <p>
            {declineOnly
              ? "Encerrar este convite sem cadastrar seu perfil?"
              : "Encerrar sua participação e retirar as duas autorizações?"}
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => save(true)}
          >
            Confirmar encerramento
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => setConfirm(false)}
          >
            Continuar aqui
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
