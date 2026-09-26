import { checkMutation } from "@/lib/auth";
import { releaseProposal } from "@/lib/domain";
import { readBody, failure } from "@/lib/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = checkMutation(request);
  if (denied) return denied;
  try {
    const { version } = await readBody(request);
    return Response.json(await releaseProposal((await params).id, version));
  } catch (e) {
    return failure(e);
  }
}
