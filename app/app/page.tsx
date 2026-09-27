import Link from "next/link";
import { IntentSearch } from "@/components/intent-search";
import { CityIcon } from "@/components/city-shell";
import { ExperienceCards } from "@/components/experience-cards";
export default function Home() {
  return (
    <main className="city-home unified-home">
      <section className="unified-entry" aria-labelledby="home-question">
        <span className="eyebrow">SUA VIDA NO GUARUJÁ, MAIS SIMPLES</span>
        <h1 id="home-question">
          O que você precisa
          <br />
          no Guarujá?
        </h1>
        <p>Conte pra gente. Ou encontre uma ideia para o seu dia.</p>
        <IntentSearch />
        <nav className="world-shortcuts" aria-label="Escolha como começar">
          {[
            ["resolver", "Resolver", "resolver"],
            ["casa", "Casa", "casa"],
            ["experiencias", "Experiências", "experiencias"],
            ["descobrir", "Descobrir", "descobrir"],
          ].map(([id, label, icon]) => (
            <Link prefetch={false} href={"/" + id} key={id}>
              <CityIcon name={icon} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </section>
      <section className="city-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">MENOS CORRERIA. MAIS MOMENTOS.</span>
            <h2>Encontre tempo para viver.</h2>
          </div>
          <Link prefetch={false} href="/experiencias" className="text-link">
            Explorar experiências ↗
          </Link>
        </div>
        <ExperienceCards />
      </section>
      <section className="city-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">UM CUIDADO COM O SEU DIA</span>
            <h2>O que você quer resolver?</h2>
          </div>
          <Link prefetch={false} href="/resolver" className="text-link">
            Ver opções ↗
          </Link>
        </div>
        <div className="quick-services">
          {[
            ["Elétrica", "resolver"],
            ["Limpeza", "spark"],
            ["Ar-condicionado", "casa"],
            ["Hidráulica", "resolver"],
          ].map(([label, icon]) => (
            <Link prefetch={false}
              key={label}
              href={
                "/descomplicar?tipo=resolver&categoria=" +
                encodeURIComponent(label)
              }
            >
              <CityIcon name={icon} />
              <span>{label}</span>
              <span aria-hidden>↗</span>
            </Link>
          ))}
        </div>
        <p className="field-note">
          Conte sua necessidade. A equipe avalia o atendimento antes de
          confirmar profissional, valor ou prazo.
        </p>
      </section>
      <section className="unified-house">
        <div>
          <span className="eyebrow">DESCOMPLICA CASA</span>
          <h2>
            Chegue com a cabeça
            <br />
            no fim de semana.
          </h2>
          <p>
            Limpeza, preparação e cuidados entre uma visita e outra. O primeiro
            passo é contar o que sua casa precisa.
          </p>
          <Link prefetch={false} href="/casa" className="text-link">
            Cuidar da minha casa →
          </Link>
        </div>
        <div className="house-checklist">
          <span className="house-checklist-heading">
            <CityIcon name="casa" /> UMA CHEGADA MAIS TRANQUILA
          </span>
          {[
            "Preparar antes de chegar",
            "Cuidar enquanto você está longe",
            "Reunir os detalhes em um pedido",
          ].map((x, i) => (
            <div key={x}>
              <span>0{i + 1}</span>
              <p>{x}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="city-section explore-callout">
        <div>
          <span className="eyebrow">A CIDADE TAMBÉM É PARTE DA HISTÓRIA</span>
          <h2>Por onde vamos começar?</h2>
          <p>
            Praias, paisagens e novas formas de aproveitar o que está perto.
          </p>
        </div>
        <Link prefetch={false} href="/descobrir" className="text-link">
          Descobrir Guarujá ↗
        </Link>
      </section>
      <section className="partner-invite">
        <span className="eyebrow">GENTE DAQUI. POSSIBILIDADES PARA TODOS.</span>
        <h2>O talento local faz parte dessa história.</h2>
        <p>
          Presta serviços no Guarujá? Estamos conhecendo profissionais e
          negócios para formar nossa rede.
        </p>
        <Link prefetch={false} href="/parceiros" className="btn btn-secondary">
          Quero fazer parte ↗
        </Link>
      </section>
    </main>
  );
}
