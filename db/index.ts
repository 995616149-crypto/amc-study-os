import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Declare it in `.openai/hosting.json` (`{\"d1\":\"DB\"}`) or provide the binding from your deployment platform before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
