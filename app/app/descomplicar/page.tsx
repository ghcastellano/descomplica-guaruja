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
  }>;
}) {
  const p = await searchParams;
  const type =
    p.tipo && Object.hasOwn(worlds, p.tipo)
      ? (p.tipo as Vertical)
      : suggestVertical(p.pedido || "");
  const category =
    type &&
    (worlds[type].categories as readonly string[]).includes(p.categoria || "")
      ? p.categoria
      : suggestCategory(p.pedido || "", type);
  return (
    <main>
      <CityIntake
        intent={(p.pedido || "").slice(0, 300)}
        initialType={type}
        initialCategory={category}
        initialGuests={Number(p.pessoas)}
      />
    </main>
  );
}
