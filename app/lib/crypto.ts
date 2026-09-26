import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { config } from "./config";
export const hash = (text: string) =>
  createHash("sha256").update(text).digest("hex");
export const equal = (a: string, b: string) =>
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));
const key = () =>
  createHash("sha256")
    .update("outbox:" + config().secret)
    .digest();
export function encrypt(text: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body]
    .map((b) => b.toString("base64url"))
    .join(".");
}
export function decrypt(value: string) {
  const [iv, tag, body] = value
    .split(".")
    .map((s) => Buffer.from(s, "base64url"));
  const cipher = createDecipheriv("aes-256-gcm", key(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(body), cipher.final()]).toString("utf8");
}
export function session() {
  const payload = String(Date.now() + 8 * 60 * 60 * 1000);
  return `${payload}.${createHmac("sha256", config().secret)
    .update("session:" + payload)
    .digest("hex")}`;
}
export function validSession(value: string) {
  const [expiry, signature] = value.split(".");
  if (
    !/^\d{13}$/.test(expiry || "") ||
    Number(expiry) <= Date.now() ||
    Number(expiry) > Date.now() + 8 * 60 * 60 * 1000
  )
    return false;
  const expected = createHmac("sha256", config().secret)
    .update("session:" + expiry)
    .digest("hex");
  return equal(signature || "", expected);
}
