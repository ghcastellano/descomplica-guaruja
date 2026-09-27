import { checkMutation } from "@/lib/auth";
import { readBody, failure } from "@/lib/http";
import { createProspect } from "@/lib/partners";
export async function POST(request: Request) {
  const denied = checkMutation(request);
  if (denied) return denied;
  try {
    return Response.json(await createProspect(await readBody(request)), {
      status: 201,
    });
  } catch (e) {
    return failure(e);
  }
}
