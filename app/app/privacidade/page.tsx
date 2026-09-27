import Link from "next/link";
export default function Page() {
  return (
    <main className="narrow">
      <span className="eyebrow">HOMOLOGAÇÃO · 27/09/2026</span>
      <h1>Seus dados, com cuidado.</h1>
      <p>
        Esta versão de avaliação salva os dados do pedido no banco dedicado do
        Descomplica Guarujá, hospedado no Neon. Nome, contato, preferências e
        descrição são usados pela equipe para avaliar e acompanhar o
        atendimento.
      </p>
      <h2>Assistente para entender seu pedido</h2>
      <p>
        Ao enviar uma descrição no campo inicial, usamos a OpenAI para sugerir
        categoria e preferências. Não inclua dados sensíveis nesse campo. Nome e
        contato solicitados depois não são enviados ao modelo. Removemos padrões
        comuns de telefone e e-mail da descrição antes do envio, mas essa
        remoção não identifica todos os dados pessoais possíveis. Você revisa as
        sugestões antes de registrar o pedido.
      </p>
      <p>
        Não salvamos o texto em um histórico de IA no nosso banco. Registramos
        contagem de uso, tokens e um identificador derivado do IP para limitar
        abuso e custos. Solicitamos que a resposta não seja armazenada pela API;
        isso não elimina as políticas próprias de retenção do provedor. Também é
        possível começar pelos atalhos e preencher as opções sem IA.
      </p>
      <h2>Quem acessa</h2>
      <p>
        A operação é protegida por acesso da equipe. O link privado do pedido
        mostra a categoria e o histórico de acompanhamento, sem expor seu
        telefone, e-mail ou notas internas. Quem possui o link pode ver esse
        acompanhamento.
      </p>
      <h2>Neste navegador</h2>
      <p>
        Guardamos apenas atalhos e protocolos dos pedidos no armazenamento
        local. Você pode removê-los em Meus pedidos. Não há analytics ou cookies
        de publicidade nesta prévia. O acesso da equipe usa um cookie de sessão.
      </p>
      <h2>Contato e remoção</h2>
      <p>
        Para consultar ou solicitar a remoção de dados, fale com a equipe pelo
        (13) 98852-3663 e informe o protocolo. Não inclua documentos, dados de
        cartão ou informações sensíveis na descrição.
      </p>
      <h2>Antes do lançamento</h2>
      <p>
        Esta é a política da prévia, não um contrato de prestação de serviços.
        Identificação jurídica, prazos de retenção e termos comerciais serão
        definidos antes da abertura pública. Não são enviados WhatsApps ou
        e-mails automáticos por esta versão.
      </p>
      <Link prefetch={false} className="text-link" href="/">
        Voltar ao início →
      </Link>
    </main>
  );
}
