import { ExperienceEstimator } from "@/components/experience-estimator";
import Link from "next/link";
import { notFound } from "next/navigation";
import { worlds, type Vertical } from "@/lib/city-catalog";
import { CityIcon } from "@/components/city-shell";
import { ExperienceCards } from "@/components/experience-cards";
export default async function Page({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world } = await params;
  if (!Object.hasOwn(worlds, world)) notFound();
  const w = worlds[world as Vertical];
  return (
    <main className="vertical-page">
      <section className="vertical-hero">
        <span className="eyebrow">DESCOMPLICA · {w.title.toUpperCase()}</span>
        <h1>{w.subtitle}</h1>
        <p className="intro">{w.description}</p>
        {world === "experiencias" ? (
          <p>
            Para o casal, ou para reunir de 2 a 8 pessoas. Montagem e
            desmontagem fazem parte do cuidado. O preço depende da coleção, do
            grupo e dos detalhes da experiência.
          </p>
        ) : (
          <div className="soft-note">
            {world === "parceiros"
              ? "Cadastro de interesse · análise individual · condições de parceria a combinar."
              : "Nova frente em avaliação. Envie sua necessidade; atendimento sujeito à disponibilidade e confirmação da equipe."}
          </div>
        )}
      </section>
      {world === "experiencias" ? (
        <ExperienceCards />
      ) : (
        <div className="service-grid">
          {w.categories.map((category, i) => (
            <Link prefetch={false}
              href={
                "/descomplicar?tipo=" +
                world +
                "&categoria=" +
                encodeURIComponent(category)
              }
              className="service-card"
              key={category}
            >
              <span className="service-number">0{i + 1}</span>
              <CityIcon name={world} />
              <h2>{category}</h2>
              <p>
                {world === "parceiros"
                  ? "Apresentar meu trabalho"
                  : "Contar o que preciso"}{" "}
                <span aria-hidden>→</span>
              </p>
            </Link>
          ))}
        </div>
      )}
      {world === "experiencias" && <ExperienceEstimator />}
      <section className="process-strip">
        {[
          "Você conta os detalhes",
          "A equipe avalia com cuidado",
          "Você decide com clareza",
        ].map((s, i) => (
          <div key={s}>
            <span>0{i + 1}</span>
            <h3>{s}</h3>
          </div>
        ))}
      </section>
      {world === "parceiros" && (
        <p className="muted">
          Nesta fase, não pedimos documentos pessoais nem dados bancários. A
          análise, o contrato e as condições de pagamento serão tratados antes
          de ativar qualquer parceria.
        </p>
      )}
    </main>
  );
}
