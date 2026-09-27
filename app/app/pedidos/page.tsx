import { SavedOrders } from "@/components/saved-orders";
export default function Page() {
  return (
    <main className="narrow">
      <span className="eyebrow">TUDO NO SEU TEMPO</span>
      <h1>Seus pedidos.</h1>
      <p className="intro">Um lugar para acompanhar cada próximo passo.</p>
      <SavedOrders />
    </main>
  );
}
