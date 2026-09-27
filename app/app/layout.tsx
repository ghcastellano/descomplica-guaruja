import type { Metadata } from "next";
import { Shell } from "@/components/city-shell";
import "./style.css";
import "./city.css";
export const metadata: Metadata = {
  title: "Descomplica Guarujá · A cidade mais perto de você",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
