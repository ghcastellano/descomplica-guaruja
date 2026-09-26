import { checkMutation } from "@/lib/auth";
import { createRequest } from "@/lib/domain";
import { readBody, failure } from "@/lib/http";
export async function POST(request: Request) {
  const denied = checkMutation(request);
  if (denied) return denied;
  try {
    return Response.json(await createRequest(await readBody(request)), {
      status: 201,
    });
  } catch (e) {
    return failure(e);
  }
}
