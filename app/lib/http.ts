import { ZodError } from "zod";
import { DomainError } from "./domain";
export function failure(error: unknown) {
  if (error instanceof DomainError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError)
    return Response.json(
      { error: error.issues.map((x) => x.message).join(" ") },
      { status: 422 },
    );
  console.error(
    "Falha na operação:",
    error instanceof Error ? error.name : "Unknown",
  );
  return Response.json(
    { error: "Não foi possível concluir. Tente novamente." },
    { status: 500 },
  );
}
export async function readBody(request: Request) {
  const text = await request.text();
  if (text.length > 16000)
    throw new DomainError(413, "Solicitação muito grande.");
  try {
    return JSON.parse(text);
  } catch {
    throw new DomainError(400, "Dados inválidos.");
  }
}
