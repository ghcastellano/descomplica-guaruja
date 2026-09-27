import Link from "next/link";
export default function Page() {
  return (
    <main className="narrow">
      <span className="eyebrow">ROTEIRO DA SOPHIA · SÓ DADOS FICTÍCIOS</span>
      <h1>
        Uma experiência,
        <br />
        do pedido ao pagamento.
      </h1>
      <p className="intro">
        Use uma janela normal como equipe e outra anônima como cliente. A equipe
        entra em /login; o cliente de teste entra com o código de homologação.
      </p>
      <ol className="request-timeline">
        {[
          [
            "Cliente: conte o que quer",
            "Na home, peça uma experiência Entre Amigas para 4 pessoas. Indique um local de preferência, use nome com prefixo TESTE e um contato fictício. Envie e guarde o link de acompanhamento.",
          ],
          [
            "Sophia: abra o pedido",
            "Entre na Área da Sophia e procure o novo pedido. Abra os detalhes e use Preparar proposta de experiência. O contato e o contexto seguem para o atendimento.",
          ],
          [
            "Sophia: complete o orçamento",
            "Escolha a coleção, o nível e a quantidade. Confirme as preferências e crie o rascunho. Revise os itens, a duração, o preço, o recado ao cliente e a nota interna. Nada é enviado automaticamente.",
          ],
          [
            "Sophia: libere a proposta",
            "Depois de revisar, libere a versão. Copie o link preparado ou volte ao acompanhamento na janela do cliente: a proposta aparecerá ali. Uma revisão posterior invalida o link anterior.",
          ],
          [
            "Cliente: escolha o horário",
            "Abra a proposta, selecione um dos locais de demonstração e uma data a partir de quatro dias à frente. Escolha um horário compatível com a preferência informada. Aceite as condições de teste. A pré-reserva inicial dura 15 minutos.",
          ],
          [
            "Cliente: teste o sinal",
            "Use o botão de pagamento do sinal no Stripe. O sinal é 50% do total. Preencha o Checkout com os dados de teste abaixo; não use cartão verdadeiro. Volte ao app após o pagamento.",
          ],
          [
            "Sophia: confira a confirmação",
            "Abra Agenda e pagamentos. A confirmação depende do webhook verificado do Stripe, não somente da tela de sucesso. Confira sinal, saldo e horário reservado. Recarregue após alguns segundos se o webhook ainda estiver chegando.",
          ],
          [
            "Cliente: teste o saldo",
            "No mesmo link, depois da confirmação do sinal, pague o saldo com o cartão de teste. Confira o estado de pagamento completo na visão da equipe. O vencimento comercial configurado é 72 horas antes do evento.",
          ],
        ].map(([title, text], i) => (
          <li key={title}>
            <span className="timeline-dot" />
            <div>
              <small>PASSO {i + 1}</small>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="card city-form">
        <h2>Cartão de teste do Stripe</h2>
        <p>
          <strong>4242 4242 4242 4242</strong>
          <br />
          Validade: 12/34 · CVC: 123
          <br />
          Nome: Cliente Teste
        </p>
        <p>
          Use um e-mail fictício, como teste@example.invalid. Se aparecerem
          campos de endereço, preencha com dados fictícios. Este cartão só
          funciona no ambiente de testes.
        </p>
        <a
          className="text-link"
          href="https://docs.stripe.com/testing"
          target="_blank"
          rel="noreferrer"
        >
          Documentação oficial do Stripe ↗
        </a>
      </section>
      <div className="soft-note">
        As praias ainda não estão liberadas para reservas reais. WhatsApp e
        e-mail são simulados: Sophia abre o sistema para acompanhar. Serviços,
        casa e parceiros estão na etapa de avaliação; o roteiro completo de
        orçamento e pagamento é o de experiências.
      </div>
      <div className="actions">
        <Link prefetch={false} className="btn btn-primary" href="/">
          Começar como cliente →
        </Link>
        <Link prefetch={false} className="text-link" href="/login">
          Entrar como Sophia →
        </Link>
      </div>
    </main>
  );
}
