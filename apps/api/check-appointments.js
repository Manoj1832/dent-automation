const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const appointments = await prisma.appointment.findMany({
      take: 5,
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(appointments, null, 2));
  } catch (e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
