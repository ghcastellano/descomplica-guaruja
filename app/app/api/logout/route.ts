import { NextResponse } from "next/server";
import { checkMutation } from "@/lib/auth";
export async function POST(request: Request) {
  const denied = checkMutation(request);
  if (denied) return denied;
  const res = NextResponse.json({ ok: true });
  res.cookies.set("dg_session", "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
