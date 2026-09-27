"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
export function CityIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    home: "M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9",
    resolver:
      "m14 6 4-4a6 6 0 0 1-7 8L4 19a2 2 0 0 1-3-3l9-7a6 6 0 0 1 8-7l-4 4Z",
    casa: "M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8",
    experiencias:
      "M12 21s-9-5.5-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12Z",
    descobrir: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4 6-2 6-6 2 2-6 6-2Z",
    pedidos: "M5 4h14v18H5V4Zm4 0V2h6v2M8 10h8M8 15h6",
    voce: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
    spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[name] || paths.spark} />
    </svg>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <>
      <div className="preview-strip">
        PRÉVIA PARA APROVAÇÃO{" "}
        <span>· Pagamentos de teste · Sem envios automáticos</span>
      </div>
      <header className="city-header">
        <Link prefetch={false} href="/" className="city-logo">
          <Image src="/logo.webp" width={46} height={46} alt="" />
          <span>
            DESCOMPLICA<small>Guarujá</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Principal">
          {[
            ["resolver", "Resolver"],
            ["casa", "Casa"],
            ["experiencias", "Experiências"],
            ["descobrir", "Descobrir"],
          ].map(([href, label]) => (
            <Link
              prefetch={false}
              key={href}
              href={"/" + href}
              aria-current={path === "/" + href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link prefetch={false} href="/pedidos" className="header-orders">
          Meus pedidos <span aria-hidden>↗</span>
        </Link>
      </header>
      <div id="conteudo">{children}</div>
      <footer className="city-footer">
        <div>
          <strong>Uma cidade. Muitas possibilidades.</strong>
          <p>Você vive o momento. A gente cuida dos detalhes.</p>
        </div>
        <nav aria-label="Institucional">
          <Link prefetch={false} href="/parceiros">
            Seja parceiro
          </Link>
          <Link prefetch={false} href="/privacidade">
            Privacidade
          </Link>
          <Link prefetch={false} href="/guia-de-testes">
            Como testar
          </Link>
          <Link prefetch={false} href="/operacao">
            Área da Sophia ↗
          </Link>
        </nav>
        <small>
          Versão em avaliação. Serviços e parcerias sujeitos à análise da
          equipe. Não há reserva ou pagamento automático nesta nova entrada.
        </small>
      </footer>
      <nav className="mobile-nav" aria-label="Navegação móvel">
        {[
          ["/", "home", "Início"],
          ["/descomplicar", "spark", "Descomplica"],
          ["/pedidos", "pedidos", "Pedidos"],
          ["/voce", "voce", "Você"],
        ].map(([href, icon, label]) => (
          <Link
            prefetch={false}
            href={href}
            key={href}
            aria-current={path === href ? "page" : undefined}
          >
            <CityIcon name={icon} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
