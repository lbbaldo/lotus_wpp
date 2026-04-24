import { Pool } from "pg";
import { env } from "../../config/env.js";

export const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 10_000
});
