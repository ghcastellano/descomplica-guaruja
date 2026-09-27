import { checkMutation } from "@/lib/auth";
import { createCityRequest } from "@/lib/city";
import { readBody, failure } from "@/lib/http";
// Single local preview process. Replace with durable per-client limits before public deployment.
let count = 0,
  reset = 0;
export async function POST(request: Request) {
  const denied = checkMutation(request, false);
  if (denied) return denied;
  if (Date.now() > reset) {
    count = 0;
    reset = Date.now() + 60000;
  }
  if (++count > 20)
    return Response.json(
      { error: "Aguarde um minuto antes de enviar outro pedido." },
      { status: 429 },
    );
  try {
    return Response.json(await createCityRequest(await readBody(request)), {
      status: 201,
    });
  } catch (e) {
    return failure(e);
  }
}
