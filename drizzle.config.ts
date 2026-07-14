import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Next.js convention: local env vars live in .env.local, not .env
config({ path: ".env.local" });

// `generate` only diffs the schema file against local migration history and
// doesn't need a live connection, so we allow a placeholder here. `migrate`
// and `studio` do need a real DATABASE_URL (from .env.local or Vercel env).
export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder/placeholder",
  },
});
