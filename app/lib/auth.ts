import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "./config";
import { validSession } from "./crypto";
export async function isAuthenticated() {
  const h = await headers();
  return (
    h.get("host") === config().host &&
    validSession((await cookies()).get("dg_v2_session")?.value || "")
  );
}
export async function requirePageAuth() {
  if (!(await isAuthenticated())) redirect("/login");
}
export function checkMutation(request: Request, authenticated = true) {
  if (
    request.headers.get("host") !== config().host ||
    request.headers.get("origin") !== config().origin
  )
    return Response.json({ error: "Origem não autorizada." }, { status: 403 });
  if (authenticated) {
    const cookie =
      request.headers
        .get("cookie")
        ?.split(";")
        .map((x) => x.trim())
        .find((x) => x.startsWith("dg_v2_session="))
        ?.slice(14) || "";
    if (!validSession(cookie))
      return Response.json(
        { error: "Entre no ambiente local para continuar." },
        { status: 401 },
      );
  }
  return null;
}
