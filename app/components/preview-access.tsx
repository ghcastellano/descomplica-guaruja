"use client";
import { useState } from "react";
export function PreviewAccess({ next }: { next: string }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const res = await fetch("/api/access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: new FormData(e.currentTarget).get("code"),
            }),
          });
          if (!res.ok) throw Error((await res.json()).error);
          window.location.assign(next);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Código de teste
        <input
          name="code"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error && (
        <p role="alert" className="feedback">
          {error}
        </p>
      )}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Entrando…" : "Entrar na versão de testes →"}
      </button>
    </form>
  );
}
