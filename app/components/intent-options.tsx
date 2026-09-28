"use client";
import type { Interpretation } from "@/lib/intent";
import { matchingServices } from "@/lib/intent-matches";
import type { Service } from "@/lib/service-catalog";
import { CityIcon } from "./city-shell";

export function IntentOptions({
  text,
  result,
  onChoose,
}: {
  text: string;
  result: Interpretation;
  onChoose: (service: Service | null) => void;
}) {
  const matches = matchingServices(text, result);
  return (
    <section
      className="concierge-response intent-results"
      aria-labelledby="intent-results-title"
    >
      <span className="eyebrow">ENCONTRE O PRÓXIMO PASSO</span>
      <h2 id="intent-results-title">
        {matches.length
          ? "Qual destas opções resolve?"
          : "Vamos entender melhor o que você precisa."}
      </h2>
      <p>
        {matches.length
          ? `Estas opções do nosso catálogo se relacionam com ${result.category.toLocaleLowerCase("pt-BR")}. Escolha a que combina com seu pedido.`
          : "Ainda não encontrei uma opção específica no catálogo. Você pode escolher uma categoria ou pedir ajuda à equipe."}
      </p>
      <div className="intent-result-list">
        {matches.map((service, index) => (
          <button
            className="intent-result"
            key={service.id}
            type="button"
            onClick={() => onChoose(service)}
          >
            <CityIcon name={service.vertical} />
            <span>
              <small>
                {index === 0 && result.serviceId === service.id
                  ? "MAIS PRÓXIMO DO SEU PEDIDO"
                  : service.category.toLocaleUpperCase("pt-BR")}
              </small>
              <strong>{service.name}</strong>
              <span>{service.questions[0]}</span>
            </span>
            <span aria-hidden>→</span>
          </button>
        ))}
      </div>
      {matches.length > 0 && (
        <p className="field-note">
          Atendimento e preço sob consulta. A equipe confirma os detalhes antes
          de você contratar.
        </p>
      )}
      <button
        className="text-button"
        type="button"
        onClick={() => onChoose(null)}
      >
        Quero ajuda para escolher →
      </button>
    </section>
  );
}
