import Link from "next/link";
import { requirePageAuth } from "@/lib/auth";
import { listPartners, partnerProtocol } from "@/lib/partners";
import { type PartnerStatus } from "@/lib/service-catalog";
import {
  ProspectForm,
  ProspectResearch,
  PartnerList,
} from "@/components/partner-admin";
export default async function Page() {
  await requirePageAuth();
  const rows = await listPartners();
  return (
    <main>
      <header className="page-top">
        <div>
          <span className="eyebrow">OPERAÇÃO · REDE LOCAL</span>
          <h1>Construa sua rede local.</h1>
          <p className="intro">
            Encontre negócios, prepare convites e acompanhe os interessados.
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
          <strong>{rows.filter((r) => r.status === "prospect").length}</strong>{" "}
          para conhecer
        </p>
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
      <ProspectResearch />
      <div className="network-admin-grid">
        <PartnerList
          rows={rows.map((r) => ({
            id: r.id,
            name: r.name,
            protocol: partnerProtocol(r.number),
            status: r.status as PartnerStatus,
          }))}
        />
        <ProspectForm />
      </div>
    </main>
  );
}
