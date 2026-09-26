import type { Metadata } from "next";
import "./style.css";
export const metadata: Metadata = {
  title: "Descomplica · Operação em teste",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="test-banner">
          AMBIENTE LOCAL DE TESTE · Dados fictícios · Nenhuma mensagem será
          enviada
        </div>
        <header className="brand">
          <a href="/">
            <img
              src="/logo.webp"
              alt="Descomplica Guarujá"
              width="52"
              height="52"
            />
            <span>
              DESCOMPLICA<small>Guarujá · operação</small>
            </span>
          </a>
          <span className="stage">Etapa 01 / Propostas</span>
        </header>
        {children}
        <footer>
          Você vive o momento. A gente cuida dos detalhes.
          <br />
          <small>
            Agenda, pagamentos e WhatsApp oficial entram nas próximas etapas.
          </small>
        </footer>
      </body>
    </html>
  );
}
