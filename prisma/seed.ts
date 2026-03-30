import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Maciek - social media manager
  await prisma.user.upsert({
    where: { email: "maciek@youmee.pl" },
    update: {},
    create: {
      name: "Maciek",
      email: "maciek@youmee.pl",
      password: hashSync("admin123", 10),
      role: "admin",
    },
  });

  // Właścicielka Youmee
  await prisma.user.upsert({
    where: { email: "admin@youmee.pl" },
    update: {},
    create: {
      name: "Youmee",
      email: "admin@youmee.pl",
      password: hashSync("admin123", 10),
      role: "admin",
    },
  });

  console.log("Seed completed!");
  console.log("Maciek: maciek@youmee.pl / admin123");
  console.log("Youmee: admin@youmee.pl / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
