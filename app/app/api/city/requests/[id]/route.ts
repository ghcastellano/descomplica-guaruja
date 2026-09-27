import { checkMutation } from "@/lib/auth";
import { updateCityRequest } from "@/lib/city";
import { readBody, failure } from "@/lib/http";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = checkMutation(request);
  if (denied) return denied;
  try {
    return Response.json(
      await updateCityRequest((await params).id, await readBody(request)),
    );
  } catch (e) {
    return failure(e);
  }
}
