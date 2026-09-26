"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sources as sourceOptions } from "@/lib/sources";
export function InquiryForm() {
  const router = useRouter(),
    key = useRef("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
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
          const res = await fetch("/api/inquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestKey: key.current,
              name: f.get("name"),
              contact: f.get("contact"),
              source: f.get("source"),
              notes: f.get("notes"),
            }),
          });
          const r = await res.json();
          if (!res.ok) throw Error(r.error);
          router.push("/atendimentos/" + r.id);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <span className="eyebrow">COMECE COM O QUE VOCÊ JÁ SABE</span>
      <h2>Guarde a conversa.</h2>
      <p>
        A experiência e a data podem ser definidas depois. O cliente não precisa
        preencher o questionário.
      </p>
      <div className="form-grid">
        <label>
          Nome do contato
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            placeholder="Use um nome fictício neste teste"
          />
        </label>
        <label>
          Telefone ou e-mail
          <input
            name="contact"
            required
            minLength={3}
            maxLength={150}
            placeholder="contato@example.invalid"
          />
        </label>
      </div>
      <label>
        Como chegou até nós?
        <select name="source" defaultValue="whatsapp_sophia">
          {Object.entries(sourceOptions).map(([id, label]) => (
            <option value={id} key={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        O que já conversaram? <small>(opcional)</small>
        <textarea
          name="notes"
          rows={5}
          maxLength={2000}
          placeholder="Ex.: quer comemorar uma data especial, ainda não definiu o formato. Use somente uma conversa fictícia."
        />
      </label>
      {error && (
        <p role="alert" className="feedback">
          {error}
        </p>
      )}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Registrando…" : "Registrar atendimento"}
      </button>
      <p className="muted">
        Registro manual pela Sophia. Este teste não lê nem importa mensagens de
        WhatsApp.
      </p>
    </form>
  );
}
