import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import type { DB } from "./types";

export const DB_TOKEN = "DB_CONNECTION";
export type Database = Kysely<DB>;

export function createDb(connectionString: string): Database {
  const isLocal = connectionString.includes("localhost");

  // pg >=8.16 treats sslmode=require/prefer/verify-ca as verify-full, which
  // rejects Supabase's self-signed pooler cert chain even when an explicit
  // ssl object is passed. Strip sslmode so our { rejectUnauthorized: false }
  // governs TLS for non-local (e.g. Supabase) connections.
  const normalized =
    !isLocal && connectionString
      ? connectionString.replace(/([?&])sslmode=[^&]*/i, "$1").replace(/[?&]$/, "")
      : connectionString;

  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: normalized,
        ssl: isLocal ? false : { rejectUnauthorized: false },
      }),
    }),
  });
}
