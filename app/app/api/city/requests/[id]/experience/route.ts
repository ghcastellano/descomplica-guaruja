import { checkMutation } from "@/lib/auth";
import { prepareExperience } from "@/lib/city";
import { failure } from "@/lib/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = checkMutation(request);
  if (denied) return denied;
  try {
    return Response.json(await prepareExperience((await params).id));
  } catch (e) {
    return failure(e);
  }
}
