import { notFound, redirect } from "next/navigation";
import { requirePageAuth } from "@/lib/auth";
import { getInquiry, protocol, sources } from "@/lib/domain";
import { Intake } from "@/components/forms";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAuth();
  const r = await getInquiry((await params).id);
  if (!r) notFound();
  if (r.proposal_id) redirect("/propostas/" + r.id);
  return (
    <main className="narrow">
      <a className="back" href="/operacao">
        ← Atendimentos
      </a>
      <span className="eyebrow">
        {protocol(r.number)} ·{" "}
        {sources[r.briefing.source as keyof typeof sources] || "Outro canal"}
      </span>
      <h1>{r.briefing.name}</h1>
      <p className="intro">
        Complete o que falta para preparar a proposta. O protocolo e a conversa
        inicial ficam preservados.
      </p>
      <details className="original-inquiry">
        <summary>Ver conversa registrada</summary>
        <p>{r.briefing.notes || "Nenhum detalhe registrado."}</p>
      </details>
      <Intake
        requestId={r.id}
        initial={{
          name: r.briefing.name,
          contact: r.briefing.contact,
          notes: r.briefing.notes,
          source: r.briefing.source,
        }}
      />
    </main>
  );
}
