const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: "manoj12k6@gmail.com" } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Dr. Manoj S",
        email: "manoj12k6@gmail.com",
        phone: "9944681832",
        password: "password123",
        role: "DOCTOR",
        isActive: true
      }
    });
    console.log("Doctor created successfully!");
  } else {
    console.log("Doctor already exists!");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
