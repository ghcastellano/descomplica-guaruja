import Link from "next/link";
import { CityIcon } from "@/components/city-shell";
export default function Page() {
  return (
    <main>
      <section className="vertical-hero">
        <span className="eyebrow">UM NOVO OLHAR PARA O QUE ESTÁ PERTO</span>
        <h1>
          Guarujá tem mais
          <br />
          de um jeito de encantar.
        </h1>
        <p className="intro">
          Comece pelas paisagens da cidade. Escolha um lugar para conhecer
          melhor e conte onde imagina viver sua próxima experiência.
        </p>
      </section>
      <div className="discovery-grid">
        {[
          [
            "Tombo",
            "Praia do Tombo",
            "Um cenário de praia para entrar no seu roteiro.",
            "praia-do-tombo",
          ],
          [
            "Astúrias",
            "Praia das Astúrias",
            "Uma parada entre Pitangueiras e Tombo.",
            "praia-das-asturias",
          ],
          [
            "Pitangueiras",
            "Praia das Pitangueiras",
            "A praia central, parte do cotidiano da cidade.",
            "praia-das-pitangueiras",
          ],
          [
            "Enseada",
            "Praia da Enseada",
            "Mais uma paisagem para descobrir no Guarujá.",
            "sample-page-2/praias",
          ],
        ].map(([name, title, desc, slug], i) => (
          <article className={"discovery-card landscape-" + i} key={name}>
            <div className="discovery-art" aria-hidden>
              <span className="landscape-sun" />
              <svg viewBox="0 0 400 150" preserveAspectRatio="none">
                <path
                  d="M0 70Q80 10 160 70T320 70T480 70V150H0Z"
                  fill="currentColor"
                  opacity=".25"
                />
                <path
                  d="M0 100Q80 40 160 100T320 100T480 100V150H0Z"
                  fill="currentColor"
                  opacity=".35"
                />
              </svg>
              <span>{String(i + 1).padStart(2, "0")} / GUARUJÁ</span>
            </div>
            <div className="discovery-content">
              <CityIcon name="descobrir" />
              <h2>{name}</h2>
              <p>{desc}</p>
              <a
                className="text-link"
                target="_blank"
                rel="noreferrer"
                href={"https://www.guaruja.sp.gov.br/" + slug}
              >
                Conheça {title} ↗
              </a>
            </div>
          </article>
        ))}
      </div>
      <p className="field-note">
        Ilustrações gráficas. Informações e acesso: páginas oficiais da
        Prefeitura de Guarujá. Estes locais são referências para visita, não
        espaços liberados para reserva de eventos.
      </p>
      <section className="partner-invite">
        <span className="eyebrow">QUAL É O SEU CENÁRIO?</span>
        <h2>Uma experiência com a sua história.</h2>
        <p>
          Praia, casa ou hospedagem: conte sua preferência. A equipe verifica as
          condições e as autorizações necessárias.
        </p>
        <Link prefetch={false}
          href="/descomplicar?tipo=experiencias"
          className="btn btn-secondary"
        >
          Imaginar meu momento →
        </Link>
      </section>
    </main>
  );
}
