import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "./config";
import { validSession } from "./crypto";
export async function isAuthenticated() {
  const h = await headers();
  return (
    h.get("host") === "127.0.0.1:3001" &&
    validSession((await cookies()).get("dg_session")?.value || "")
  );
}
export async function requirePageAuth() {
  if (!(await isAuthenticated())) redirect("/login");
}
export function checkMutation(request: Request, authenticated = true) {
  if (
    request.headers.get("host") !== "127.0.0.1:3001" ||
    request.headers.get("origin") !== config().origin
  )
    return Response.json({ error: "Origem não autorizada." }, { status: 403 });
  if (authenticated) {
    const cookie =
      request.headers
        .get("cookie")
        ?.split(";")
        .map((x) => x.trim())
        .find((x) => x.startsWith("dg_session="))
        ?.slice(11) || "";
    if (!validSession(cookie))
      return Response.json(
        { error: "Entre no ambiente local para continuar." },
        { status: 401 },
      );
  }
  return null;
}
