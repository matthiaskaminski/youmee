import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  await prisma.user.upsert({
    where: { email: "admin@youmee.pl" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@youmee.pl",
      password: hashSync("admin123", 10),
      role: "admin",
    },
  });

  // Create client user
  await prisma.user.upsert({
    where: { email: "klient@youmee.pl" },
    update: {},
    create: {
      name: "Klientka Youmee",
      email: "klient@youmee.pl",
      password: hashSync("klient123", 10),
      role: "client",
    },
  });

  console.log("Seed completed!");
  console.log("Admin: admin@youmee.pl / admin123");
  console.log("Klient: klient@youmee.pl / klient123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
