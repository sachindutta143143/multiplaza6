import { ensureDbReady, db } from "./src/db";
import { customers, bills } from "./src/db/schema";
import { ilike, or } from "drizzle-orm";

async function run() {
  await ensureDbReady();
  const q = "%sharma%";
  const matchingCusts = await db.select({ id: customers.id }).from(customers).where(or(ilike(customers.name, q), ilike(customers.mobile, q)));
  console.log("Matching customers:", matchingCusts);
}

run().catch(console.error);
