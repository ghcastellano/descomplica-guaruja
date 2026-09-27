import Link from "next/link";
export default function Page() {
  return (
    <main className="narrow">
      <span className="eyebrow">DO SEU JEITO</span>
      <h1>Você no Guarujá.</h1>
      <p className="intro">
        Sem senha para começar. Seus pedidos têm acompanhamento por link
        privado.
      </p>
      <div className="service-grid">
        <Link prefetch={false} className="service-card" href="/pedidos">
          <h2>Meus pedidos</h2>
          <p>Retome de onde parou →</p>
        </Link>
        <Link prefetch={false} className="service-card" href="/parceiros">
          <h2>Sou profissional</h2>
          <p>Apresente seu trabalho →</p>
        </Link>
        <Link prefetch={false} className="service-card" href="/operacao">
          <h2>Área da equipe</h2>
          <p>Acesso da Sophia →</p>
        </Link>
      </div>
    </main>
  );
}
