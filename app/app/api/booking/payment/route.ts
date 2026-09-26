import { checkMutation } from "@/lib/auth";
import { readBody, failure } from "@/lib/http";
import { recordSimulatedPayment } from "@/lib/booking";
export async function POST(request: Request) {
  const denied = checkMutation(request);
  if (denied) return denied;
  try {
    return Response.json(await recordSimulatedPayment(await readBody(request)));
  } catch (e) {
    return failure(e);
  }
}
