import Link from "next/link";
import { requirePageAuth } from "@/lib/auth";
import { listPartners, partnerProtocol } from "@/lib/partners";
import { partnerStatuses, type PartnerStatus } from "@/lib/service-catalog";
import { ProspectForm } from "@/components/partner-admin";
export default async function Page() {
  await requirePageAuth();
  const rows = await listPartners();
  return (
    <main>
      <header className="page-top">
        <div>
          <span className="eyebrow">OPERAÇÃO · REDE LOCAL</span>
          <h1>Gente que faz acontecer.</h1>
          <p className="intro">
            Indicações, cadastros e decisões em um só lugar.
          </p>
        </div>
        <Link href="/parceiros" className="btn btn-secondary">
          Ver cadastro voluntário ↗
        </Link>
      </header>
      <nav className="workspace-tabs" aria-label="Operação">
        <Link href="/operacao">Atendimentos</Link>
        <Link href="/agenda">Agenda e pagamentos</Link>
        <Link href="/operacao/rede" aria-current="page">
          Rede local
        </Link>
      </nav>
      <div className="summary">
        <p>
          <strong>
            {
              rows.filter((r) => ["pending", "reviewing"].includes(r.status))
                .length
            }
          </strong>{" "}
          para avaliar
        </p>
        <p>
          <strong>{rows.filter((r) => r.status === "qualified").length}</strong>{" "}
          pré-cadastros aprovados
        </p>
      </div>
      <div className="network-admin-grid">
        <section>
          <h2>Profissionais e indicações</h2>
          {rows.length ? (
            <div className="inbox">
              {rows.map((r) => (
                <Link
                  href={"/operacao/rede/" + r.id}
                  className="inbox-row"
                  key={r.id}
                >
                  <div>
                    <span className="eyebrow">{partnerProtocol(r.number)}</span>
                    <h3>{r.name}</h3>
                  </div>
                  <span className="badge">
                    {partnerStatuses[r.status as PartnerStatus]} →
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p>
              Nenhum registro ainda. Uma indicação ou inscrição voluntária
              inicia a avaliação.
            </p>
          )}
        </section>
        <ProspectForm />
      </div>
    </main>
  );
}
