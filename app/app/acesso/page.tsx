import Link from "next/link";
import { PreviewAccess } from "@/components/preview-access";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ voltar?: string }>;
}) {
  const { voltar } = await searchParams;
  const next =
    voltar &&
    voltar.startsWith("/") &&
    !voltar.startsWith("//") &&
    !voltar.includes("\\")
      ? voltar
      : "/";
  return (
    <main className="login">
      <span className="eyebrow">HOMOLOGAÇÃO · ACESSO CONVIDADO</span>
      <h1>
        Vamos descomplicar,
        <br />
        em modo de teste.
      </h1>
      <p className="intro">
        Esta versão permite testar pedidos, propostas e pagamentos fictícios.
        Nenhuma cobrança real é feita.
      </p>
      <div className="paper card">
        <PreviewAccess next={next} />
      </div>
      <p className="field-note">
        Use o código compartilhado por Gustavo. A equipe acessa sua área com um
        código separado.
      </p>
      <Link prefetch={false} className="text-link" href="/login">
        Sou da equipe →
      </Link>
    </main>
  );
}
