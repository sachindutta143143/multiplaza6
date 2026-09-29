import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, ensureDbReady } from "./index";
import {
  users,
  catalogItems,
  appSettings,
  customers,
  bills,
  billItems,
  payments,
  backups,
} from "./schema";
import { DEFAULT_SETTINGS } from "../lib/settings";

const CATALOG: { name: string; rate: number; category: string }[] = [
  { name: "Service", rate: 800, category: "Service" },
  { name: "Toner", rate: 1200, category: "Consumable" },
  { name: "Drum", rate: 1900, category: "Spare Part" },
  { name: "Roller", rate: 450, category: "Spare Part" },
  { name: "Chip", rate: 250, category: "Spare Part" },
  { name: "Fuser", rate: 3500, category: "Spare Part" },
  { name: "Developer", rate: 1600, category: "Consumable" },
  { name: "Cleaning Blade", rate: 350, category: "Spare Part" },
  { name: "Corona Assembly", rate: 700, category: "Spare Part" },
  { name: "Teflon Roller", rate: 950, category: "Spare Part" },
  { name: "Gear Kit", rate: 650, category: "Spare Part" },
  { name: "Machine Cleaning", rate: 500, category: "Service" },
  { name: "Cartridge", rate: 2800, category: "Consumable" },
];

/**
 * Initializes the clean shop database:
 * - Creates default admin user (admin / admin123)
 * - Sets default business profile (Multi Plaza)
 * - Sets default items & rates catalog
 * - NO DEMO BILLS, NO DEMO CUSTOMERS, NO DUMMY PAYMENTS!
 * Completely empty & fresh for real shop transactions.
 */
export async function runSeed(options: { force?: boolean } = {}) {
  await ensureDbReady();
  const existing = await db.select().from(users).limit(1);
  if (existing.length && !options.force) {
    return { skipped: true as const, billCount: 0 };
  }

  await db.transaction(async (tx) => {
    // Delete any old transactions / dummy data
    await tx.delete(payments);
    await tx.delete(billItems);
    await tx.delete(bills);
    await tx.delete(customers);
    await tx.delete(catalogItems);
    await tx.delete(backups);
    await tx.delete(appSettings);
    await tx.delete(users);

    // Create the admin account
    const passwordHash = await bcrypt.hash("admin123", 10);
    await tx
      .insert(users)
      .values({ username: "admin", passwordHash, name: "Admin", role: "admin" })
      .returning();

    // Default shop settings
    await tx.insert(appSettings).values({ id: 1, data: { ...DEFAULT_SETTINGS } });

    // Pre-populate standard product & service catalog for quick billing
    for (const c of CATALOG) {
      await tx.insert(catalogItems).values({
        name: c.name,
        defaultRate: String(c.rate),
        category: c.category,
      });
    }
  });

  return { skipped: false as const, billCount: 0 };
}

// Idempotent startup guard
const globalForSeed = globalThis as typeof globalThis & {
  __mpEnsureSeeded?: Promise<unknown>;
};

export function ensureSeeded(): Promise<unknown> {
  if (!globalForSeed.__mpEnsureSeeded) {
    globalForSeed.__mpEnsureSeeded = runSeed().catch((e) => {
      globalForSeed.__mpEnsureSeeded = undefined;
      throw e;
    });
  }
  return globalForSeed.__mpEnsureSeeded;
}

if (require.main === module) {
  runSeed({ force: process.argv.includes("--force") })
    .then((r) => {
      console.log("Database initialized (100% clean, no demo bills):", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
