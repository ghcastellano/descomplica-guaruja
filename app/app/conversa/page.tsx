import { requirePageAuth } from "@/lib/auth";
import { InquiryForm } from "@/components/inquiry";
export default async function Page() {
  await requirePageAuth();
  return (
    <main className="narrow">
      <a className="back" href="/">
        ← Atendimentos
      </a>
      <span className="eyebrow">SEM QUESTIONÁRIO OBRIGATÓRIO</span>
      <h1>A conversa já começou.</h1>
      <p className="intro">
        Registre o pedido que chegou por WhatsApp, Instagram ou indicação. Tudo
        continua no mesmo atendimento.
      </p>
      <InquiryForm />
    </main>
  );
}
