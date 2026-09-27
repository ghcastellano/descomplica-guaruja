import { checkMutation } from "@/lib/auth";
import { readBody, failure } from "@/lib/http";
import { applyPartner, networkActor } from "@/lib/partners";
export async function POST(request: Request) {
  const denied = checkMutation(request, false);
  if (denied) return denied;
  try {
    return Response.json(
      await applyPartner(await readBody(request), networkActor(request)),
      { status: 201 },
    );
  } catch (e) {
    return failure(e);
  }
}
