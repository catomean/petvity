import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy singleton — neon() is not called at module load time so Next.js build
// analysis doesn't throw when DATABASE_URL is absent in the build environment.
type DbInstance = ReturnType<typeof drizzle<typeof schema>>;
let _instance: DbInstance | undefined;

export function getInstance(): DbInstance {
  if (!_instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    _instance = drizzle(neon(url), { schema });
  }
  return _instance;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop: string | symbol) {
    return Reflect.get(getInstance(), prop);
  },
});
