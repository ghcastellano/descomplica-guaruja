import { serviceById } from "@/lib/service-catalog";
import { redirect } from "next/navigation";
import { CityIntake } from "@/components/city-intake";
import {
  worlds,
  suggestVertical,
  suggestCategory,
  type Vertical,
} from "@/lib/city-catalog";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    pedido?: string;
    tipo?: string;
    categoria?: string;
    pessoas?: string;
    servico?: string;
  }>;
}) {
  const p = await searchParams;
  const service = serviceById(p.servico || "");
  const type: Vertical =
    service?.vertical ||
    (p.tipo && Object.hasOwn(worlds, p.tipo)
      ? (p.tipo as Vertical)
      : suggestVertical(p.pedido || ""));
  if (type === "parceiros") redirect("/parceiros");
  const category =
    service?.category ||
    ((worlds[type].categories as readonly string[]).includes(p.categoria || "")
      ? p.categoria
      : suggestCategory(p.pedido || "", type));
  return (
    <main>
      <CityIntake
        intent={(p.pedido || "").slice(0, 300)}
        initialType={type}
        initialServiceId={service?.id}
        initialCategory={category}
        initialGuests={Number(p.pessoas)}
      />
    </main>
  );
}
