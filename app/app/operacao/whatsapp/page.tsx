import { requirePageAuth } from "@/lib/auth";
import { recentWhatsAppEvents, whatsappStatus } from "@/lib/whatsapp";
const labels: Record<string, string> = { sent: "Enviada", delivered: "Entregue", read: "Lida", failed: "Falha na entrega", deleted: "Excluída" };
export default async function Page() {
  await requirePageAuth();
  const status = whatsappStatus();
  const events = await recentWhatsAppEvents();
  return <main className="narrow">
    <span className="eyebrow">INTEGRAÇÃO EM TESTE</span>
    <h1>WhatsApp</h1>
    <p className="intro">{status.enabled && !status.missing.length ? "Configurado para os telefones autorizados de teste." : "Aguardando concluir a configuração na Meta."}</p>
    <p>Esta etapa registra mensagens e confirmações de entrega. Os eventos ainda não criam pedidos ou propostas automaticamente.</p>
    <div className="actions"><a className="btn btn-secondary" href="/operacao/whatsapp">Atualizar eventos</a><a className="text-link" href="/operacao">Voltar à operação</a></div>
    <section className="city-form card">
      <h2>Últimos eventos</h2>
      {!events.length && <p>Nenhum evento recebido. Após conectar a Meta, envie uma mensagem pelo telefone autorizado para testar.</p>}
      {events.map(e => <article key={e.id}>
        <h3>{e.kind === "message" ? "Mensagem recebida" : labels[e.payload.status || ""] || "Atualização"} · final {e.payload.contact.slice(-4)}</h3>
        <p><time dateTime={e.at.toISOString()}>{e.at.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time></p>
        {e.kind === "message" && <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{e.payload.text || `Mensagem do tipo ${e.payload.type}; conteúdo não importado nesta etapa.`}</p>}
        {!!e.payload.errorCodes?.length && <p>Código informado pela Meta: {e.payload.errorCodes.join(", ")}</p>}
      </article>)}
    </section>
  </main>;
}
