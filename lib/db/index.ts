import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Lazy singleton — the Pool is not created at module load time so Next.js build
// analysis doesn't throw when DATABASE_URL is absent in the build environment.
type DbInstance = ReturnType<typeof drizzle<typeof schema>>;
let _instance: DbInstance | undefined;

export function getInstance(): DbInstance {
  if (!_instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    _instance = drizzle(new Pool({ connectionString: url }), { schema });
  }
  return _instance;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop: string | symbol) {
    return Reflect.get(getInstance(), prop);
  },
});
