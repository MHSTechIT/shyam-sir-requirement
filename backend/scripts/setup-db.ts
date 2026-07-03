import { ensureSchema, pool } from "../src/db";

// Create all tables/indexes/constraints (idempotent). Safe to run any time.
ensureSchema()
  .then(() => console.log("Schema ensured (tables ready)."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
