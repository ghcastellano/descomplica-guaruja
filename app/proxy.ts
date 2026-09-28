import { NextRequest, NextResponse } from "next/server";
import { validSession } from "./lib/crypto";
export function proxy(request: NextRequest) {
  const origin = process.env.APP_ORIGIN || "http://127.0.0.1:3002";
  if (request.headers.get("host") !== new URL(origin).host)
    return new NextResponse("Host não autorizado.", { status: 403 });
  if (process.env.APP_MODE === "staging-test") {
    const path = request.nextUrl.pathname;
    const publicEntry = [
      "/acesso",
      "/api/access",
      "/login",
      "/api/login",
      "/api/stripe/webhook",
      "/api/whatsapp/webhook",
    ].includes(path);
    const asset =
      path.startsWith("/_next/") ||
      path.startsWith("/fonts/") ||
      path.startsWith("/img/") ||
      ["/logo.webp", "/favicon.ico"].includes(path);
    const staff = validSession(
      request.cookies.get("dg_v2_session")?.value || "",
    );
    const preview = validSession(
      request.cookies.get("dg_preview")?.value || "",
      "preview",
    );
    if (!publicEntry && !asset && !staff && !preview) {
      if (path.startsWith("/api/"))
        return NextResponse.json(
          { error: "Entre na homologação para continuar." },
          { status: 401 },
        );
      const target = new URL("/acesso", origin);
      target.searchParams.set("voltar", path + request.nextUrl.search);
      return NextResponse.redirect(target);
    }
  }
  return NextResponse.next();
}
export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
