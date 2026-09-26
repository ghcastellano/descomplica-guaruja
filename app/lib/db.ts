import postgres from "postgres";
import { config } from "./config";
const globalDB = globalThis as unknown as {
  descomplicaDB?: ReturnType<typeof postgres>;
};
export const db =
  globalDB.descomplicaDB ??
  postgres(config().database, { max: 5, connect_timeout: 5 });
globalDB.descomplicaDB = db;
