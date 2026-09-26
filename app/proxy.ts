import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  if (request.headers.get("host") !== "127.0.0.1:3001")
    return new NextResponse("Ambiente restrito a testes locais.", {
      status: 403,
    });
  return NextResponse.next();
}
export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
