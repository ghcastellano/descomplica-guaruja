import { NextResponse } from "next/server";
import { checkMutation } from "@/lib/auth";
import { equal, session } from "@/lib/crypto";
import { config } from "@/lib/config";
import { readBody, failure } from "@/lib/http";
let attempts = 0,
  reset = 0;
export async function POST(request: Request) {
  const denied = checkMutation(request, false);
  if (denied) return denied;
  try {
    if (Date.now() > reset) {
      attempts = 0;
      reset = Date.now() + 60000;
    }
    if (++attempts > 10)
      return Response.json(
        { error: "Aguarde um minuto para tentar novamente." },
        { status: 429 },
      );
    const { code } = await readBody(request);
    if (typeof code !== "string" || !equal(code, config().accessCode))
      return Response.json({ error: "Código incorreto." }, { status: 401 });
    attempts = 0;
    const res = NextResponse.json({ ok: true });
    res.cookies.set("dg_v2_session", session(), {
      httpOnly: true,
      secure: config().hosted,
      sameSite: "strict",
      path: "/",
      maxAge: 28800,
    });
    if (config().hosted)
      res.cookies.set("dg_preview", session("preview"), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 28800,
      });
    return res;
  } catch (e) {
    return failure(e);
  }
}
