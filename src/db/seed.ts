// DATABASE_URL is loaded via NODE_OPTIONS=-r dotenv/config in the db:seed
// npm script (see package.json) — this runs before any import below, since
// ES import declarations are hoisted above ordinary top-level statements.
import { db } from "./index";
import { todos, settings } from "./schema";
import { TODOS_BY_PHASE, type Phase } from "../lib/content";
import { sql } from "drizzle-orm";

async function seed() {
  // Seed todos idempotently: skip rows that already exist for (phase, item_id).
  const phases = Object.keys(TODOS_BY_PHASE) as Phase[];
  let inserted = 0;
  for (const phase of phases) {
    for (const item of TODOS_BY_PHASE[phase]) {
      const result = await db
        .insert(todos)
        .values({ phase, itemId: item.itemId, done: false })
        .onConflictDoNothing({ target: [todos.phase, todos.itemId] })
        .returning({ id: todos.id });
      if (result.length > 0) inserted++;
    }
  }
  console.log(`Seeded todos: ${inserted} new row(s) inserted.`);

  // Ensure the single settings row (id=1) exists, with schema defaults.
  await db
    .insert(settings)
    .values({ id: 1 })
    .onConflictDoNothing({ target: settings.id });
  console.log("Ensured settings row exists.");

  // Sanity check
  const count = await db.execute(sql`select count(*)::int as count from ${todos}`);
  console.log("Total todos in DB:", count.rows[0]?.count);
}

seed()
  .then(() => {
    console.log("Seed complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
