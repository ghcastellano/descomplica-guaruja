import { Login } from "@/components/forms";
export default function Page() {
  return (
    <main className="login">
      <span className="eyebrow">BEM-VINDA, SOPHIA</span>
      <h1>
        Cuidar de cada
        <br />
        história começa aqui.
      </h1>
      <p className="intro">
        Um lugar para receber pedidos, revisar os detalhes e acompanhar cada
        proposta.
      </p>
      <div className="paper card">
        <Login />
      </div>
    </main>
  );
}
