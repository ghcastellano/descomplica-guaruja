"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
export function SavedOrders() {
  const [items, setItems] = useState<
    { url: string; protocol: string }[] | null
  >(null);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("dg-orders") || "[]");
      setItems(
        Array.isArray(v)
          ? v.filter(
              (x) =>
                /^\/pedidos\/[\w-]{43}$/.test(x?.url) &&
                /^GU-\d+$/.test(x?.protocol),
            )
          : [],
      );
    } catch {
      setItems([]);
    }
  }, []);
  if (items === null) return <p role="status">Abrindo seus pedidos…</p>;
  return (
    <>
      {items.length ? (
        <div className="inbox">
          {items.map((x) => (
            <Link prefetch={false} className="inbox-row" key={x.url} href={x.url}>
              <strong>{x.protocol}</strong>
              <span>Acompanhar →</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>Suas próximas histórias começam aqui.</h2>
          <p>
            Os pedidos feitos neste navegador aparecem nesta página. Se você
            recebeu um link privado, abra-o para acompanhar.
          </p>
          <Link prefetch={false} href="/descomplicar" className="btn btn-primary">
            Começar um pedido →
          </Link>
        </div>
      )}
      <p className="field-note">
        Os atalhos ficam somente neste navegador. Guarde o link privado do
        pedido para abrir em outro dispositivo.
      </p>
      {items.length > 0 && (
        <button
          className="text-button"
          onClick={() => {
            localStorage.removeItem("dg-orders");
            setItems([]);
          }}
        >
          Remover atalhos deste navegador
        </button>
      )}
    </>
  );
}
