import { z } from "zod";
import { checkMutation } from "@/lib/auth";
import { readBody, failure } from "@/lib/http";
import { actorHash, interpretIntent } from "@/lib/intent-ai";
export const maxDuration = 20;
const input = z
  .object({ text: z.string().trim().min(3).max(600), requestKey: z.uuid() })
  .strict();
export async function POST(request: Request) {
  const denied = checkMutation(request, false);
  if (denied) return denied;
  try {
    const body = input.parse(await readBody(request));
    return Response.json(
      await interpretIntent(body.text, body.requestKey, actorHash(request)),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
