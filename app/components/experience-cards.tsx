import Link from "next/link";
import Image from "next/image";
export function ExperienceCards() {
  return (
    <div className="experience-grid">
      {[
        [
          "A Dois",
          "Só vocês dois. O mundo pode esperar.",
          "casal-por-do-sol-col-800.webp",
          "2 pessoas",
        ],
        [
          "Celebrar",
          "Um novo ano. Uma história para guardar.",
          "experiencia-flores-col-800.webp",
          "2 a 8 pessoas",
        ],
        [
          "Entre Amigas",
          "Risadas, reencontros e tempo juntas.",
          "experiencia-boho-praia-col-800.webp",
          "2 a 8 pessoas",
        ],
        [
          "Pedido",
          "O próximo capítulo começa aqui.",
          "pedido-casamento-praia-col-800.webp",
          "2 a 8 pessoas",
        ],
      ].map(([name, desc, img, count]) => (
        <Link prefetch={false}
          className="experience-card"
          href={
            "/descomplicar?tipo=experiencias&categoria=" +
            encodeURIComponent(name)
          }
          key={name}
        >
          <div className="experience-image">
            <Image
              src={"/img/" + img}
              alt={"Cenário da coleção " + name}
              fill
              sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 25vw"
            />
            <span>{count}</span>
          </div>
          <div className="experience-title">
            <h3>{name}</h3>
            <span aria-hidden>↗</span>
          </div>
          <p>{desc}</p>
          <small>Planejada com você · proposta personalizada</small>
        </Link>
      ))}
    </div>
  );
}
