import { checkMutation } from "@/lib/auth";
import { reviseProposal } from "@/lib/domain";
import { readBody, failure } from "@/lib/http";
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = checkMutation(request);
  if (denied) return denied;
  try {
    const { version, revision } = await readBody(request);
    return Response.json(
      await reviseProposal((await params).id, version, revision),
    );
  } catch (e) {
    return failure(e);
  }
}
