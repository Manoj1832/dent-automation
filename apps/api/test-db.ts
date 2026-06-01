import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.$connect().then(() => {
  console.log("SUCCESS!");
  process.exit(0);
}).catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
