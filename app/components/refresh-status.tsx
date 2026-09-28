"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
export function RefreshStatus() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [updated, setUpdated] = useState(false);
  return <div className="action-control">
    <button className="btn btn-secondary" disabled={pending} onClick={() => {
      setUpdated(true);
      startTransition(() => router.refresh());
    }}>{pending ? "Atualizando…" : "Atualizar acompanhamento"}</button>
    <p role="status" className="action-feedback">{updated && !pending ? "Situação atualizada." : ""}</p>
  </div>;
}
