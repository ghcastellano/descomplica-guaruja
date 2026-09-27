import { checkMutation } from "@/lib/auth";
import { readBody, failure } from "@/lib/http";
import { updatePartnerPermission } from "@/lib/partners";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const denied = checkMutation(request, false);
  if (denied) return denied;
  try {
    return Response.json(
      await updatePartnerPermission(
        (await params).token,
        await readBody(request),
      ),
    );
  } catch (e) {
    return failure(e);
  }
}
