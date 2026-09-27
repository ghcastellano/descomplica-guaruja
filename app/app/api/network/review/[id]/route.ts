import { checkMutation } from "@/lib/auth";
import { readBody, failure } from "@/lib/http";
import { reviewPartner } from "@/lib/partners";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = checkMutation(request);
  if (denied) return denied;
  try {
    return Response.json(
      await reviewPartner((await params).id, await readBody(request)),
    );
  } catch (e) {
    return failure(e);
  }
}
