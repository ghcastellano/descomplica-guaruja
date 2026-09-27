import { PartnerOnboarding } from "@/components/partner-onboarding";
import { CityIcon } from "@/components/city-shell";
export default function Page() {
  return (
    <main className="network-page">
      <header className="network-intro">
        <span className="eyebrow">QUEM FAZ A CIDADE ACONTECER</span>
        <h1>
          Seu talento.
          <br />
          Novas possibilidades.
        </h1>
        <p className="intro">
          Estamos conhecendo profissionais que cuidam do Guarujá. Conte o que
          você faz e onde atende. O próximo passo começa com uma conversa.
        </p>
        <div className="network-promises">
          {[
            "Cadastro sem custo",
            "Análise pela nossa equipe",
            "Você escolhe participar",
          ].map((x) => (
            <span key={x}>
              <CityIcon name="spark" />
              {x}
            </span>
          ))}
        </div>
      </header>
      <PartnerOnboarding />
    </main>
  );
}
