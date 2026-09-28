import { verifyChallenge, receiveWhatsApp } from "@/lib/whatsapp";
import { failure } from "@/lib/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { return new Response(verifyChallenge(request.url), { headers: { "Cache-Control": "no-store", "Content-Type": "text/plain" } }); }
  catch (e) { return failure(e); }
}
export async function POST(request: Request) {
  // Bound the stream before buffering; Content-Length alone is not trustworthy.
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 256_000) { await reader.cancel(); return new Response(null, { status: 413 }); }
      chunks.push(value);
    }
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
    await receiveWhatsApp(raw, request.headers.get("x-hub-signature-256"));
    return Response.json({ ok: true });
  } catch (e) { return failure(e); }
}
