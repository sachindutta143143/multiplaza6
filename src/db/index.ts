import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { EMBEDDED_SCHEMA_SQL } from "./embedded-schema";

type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: Db;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __mpPgLiteClient?: any;
  __mpPgLiteDb?: Db;
  __mpPgLiteReady?: Promise<void>;
};

function getActiveDb(): Db {
  const pglitePath = process.env.PGLITE_PATH?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    if (!globalForDb.__arenaNextJsPostgresqlDb) {
      const isLocalhost = databaseUrl.includes("127.0.0.1") || databaseUrl.includes("localhost");
      const pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
      });
      globalForDb.__arenaNextJsPostgresqlPool = pgPool;
      globalForDb.__arenaNextJsPostgresqlDb = drizzle(pgPool, { schema });
    }
    return globalForDb.__arenaNextJsPostgresqlDb;
  }

  // If PGLITE_PATH is set OR neither is set (e.g. build phase on Railway / local desktop without .env)
  const defaultDir = pglitePath || "./data/multiplaza-data";
  if (!globalForDb.__mpPgLiteClient) {
    const path = require("node:path");
    const fs = require("node:fs");
    const dataDir = path.isAbsolute(defaultDir)
      ? defaultDir
      : path.join(process.cwd(), defaultDir);
    fs.mkdirSync(dataDir, { recursive: true });

    const { PGlite } = require("@electric-sql/pglite");
    const { drizzle: drizzlePgLite } = require("drizzle-orm/pglite");
    const client = new PGlite(dataDir);
    globalForDb.__mpPgLiteClient = client;

    const instance = drizzlePgLite(client as never, { schema } as never) as unknown as Db;
    globalForDb.__mpPgLiteDb = instance;

    const ready = (async () => {
      try {
        await client.exec(EMBEDDED_SCHEMA_SQL);
      } catch (e) {
        console.error("Embedded schema init error:", e);
      }
    })();
    globalForDb.__mpPgLiteReady = ready;
  }

  return globalForDb.__mpPgLiteDb!;
}

// Proxy wrapper: ALWAYS forwards calls dynamically to the active DB
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const targetDb = getActiveDb();
    // @ts-ignore
    const val = targetDb?.[prop];
    if (typeof val === "function") {
      return val.bind(targetDb);
    }
    return val;
  },
});

export const pool: Pool | null = globalForDb.__arenaNextJsPostgresqlPool ?? null;

export async function ensureDbReady(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    getActiveDb(); // ensure pool is created
    if (globalForDb.__arenaNextJsPostgresqlPool) {
      try {
        await globalForDb.__arenaNextJsPostgresqlPool.query(EMBEDDED_SCHEMA_SQL);
      } catch (e) {
        console.error("Auto schema init on PostgreSQL error:", e);
      }
    }
  } else {
    getActiveDb();
    if (globalForDb.__mpPgLiteReady) {
      await globalForDb.__mpPgLiteReady;
    }
  }
}

export { schema };
