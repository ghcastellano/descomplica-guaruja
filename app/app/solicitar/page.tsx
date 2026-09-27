import { requirePageAuth } from "@/lib/auth";
import { Intake } from "@/components/forms";
export default async function Page() {
  await requirePageAuth();
  return (
    <main className="narrow">
      <a className="back" href="/operacao">
        ← Solicitações
      </a>
      <span className="eyebrow">NOVO PEDIDO · SIMULAÇÃO</span>
      <h1>Conte o momento.</h1>
      <p className="intro">
        Teste o recebimento de um pedido. Use informações fictícias; o
        questionário público ainda não envia dados para este ambiente.
      </p>
      <Intake />
    </main>
  );
}
