"use client";
import { useState } from "react";
export function CopyLink() {
  const [status, setStatus] = useState("");
  return (
    <div className="action-control">
      <button
        className="btn btn-secondary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(location.href);
            setStatus("Link copiado. Guarde em um lugar seguro.");
          } catch {
            setStatus("Copie o endereço desta página para guardar seu link.");
          }
        }}
      >
        Copiar link privado
      </button>
      <p className="action-feedback" role="status">{status}</p>
    </div>
  );
}
