/**
 * Bootstrap an admin workspace for a given email address.
 *
 * Usage:
 *   cd server
 *   node scripts/bootstrap-admin.js your@email.com
 *
 * The user must already have logged in at /app/login at least once
 * so that their Supabase auth created a row in the `users` table.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/bootstrap-admin.js <email>");
  process.exit(1);
}

async function main() {
  // Find the user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `No user found with email "${email}".\n` +
        "Make sure you have logged in at /app/login at least once first.",
    );
    process.exit(1);
  }

  // Check if they already have an admin workspace
  const existing = await prisma.organizationMember.findFirst({
    where: {
      userId: user.id,
      organization: { type: "admin" },
    },
    include: { organization: true },
  });

  if (existing) {
    console.log(
      `✓ User "${email}" already has admin workspace: "${existing.organization.name}" (${existing.role})`,
    );
    process.exit(0);
  }

  // Create the admin organization
  const org = await prisma.organization.create({
    data: {
      name: "Prism Admin",
      type: "admin",
    },
  });

  // Add the user as super_admin
  await prisma.organizationMember.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: "super_admin",
    },
  });

  // Set as their default org if they don't have one
  if (!user.defaultOrganizationId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { defaultOrganizationId: org.id },
    });
  }

  console.log(`✓ Admin workspace created for "${email}"`);
  console.log(`  Org: ${org.name} (${org.id})`);
  console.log(`  Role: super_admin`);
  console.log(`\nNow log in at /app/login and you'll see the Admin workspace.`);
}

main()
  .catch((err) => {
    console.error("Bootstrap failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
