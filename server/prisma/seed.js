/**
 * Prism seed script — idempotent, safe to run on any environment.
 *
 * What it does:
 *   - Nothing destructive. Never creates fake users, orgs, or campaigns.
 *   - Can be extended to pre-populate PlatformSettings defaults if needed.
 *
 * Run with:  node prisma/seed.js
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Platform settings defaults are handled at runtime via config.js constants
  // (CPM rates, platform fee, PayPal mode). No seed data needed.
  console.log("Seed complete — no data to seed (all defaults are handled at runtime).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
