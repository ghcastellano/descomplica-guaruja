import { failure } from "@/lib/http";
import { DomainError } from "@/lib/domain";
import { verifyStripeEvent, processStripeEvent } from "@/lib/stripe";
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 256000) throw new DomainError(413, "Evento muito grande.");
    const event = verifyStripeEvent(
      raw,
      request.headers.get("stripe-signature") || "",
    );
    return Response.json(await processStripeEvent(event));
  } catch (e) {
    return failure(e);
  }
}
