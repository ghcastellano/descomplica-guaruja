import { checkMutation } from "@/lib/auth";
import { readBody, failure } from "@/lib/http";
import { createStripeCheckout } from "@/lib/stripe";
export async function POST(request: Request) {
  const denied = checkMutation(request, false);
  if (denied) return denied;
  try {
    return Response.json(await createStripeCheckout(await readBody(request)));
  } catch (e) {
    return failure(e);
  }
}
