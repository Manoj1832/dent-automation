const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const dto = { date: '2026-05-16' };
    const where = {};
    if (dto.date) {
        const dateStart = new Date(dto.date);
        dateStart.setUTCHours(0, 0, 0, 0);
        const dateEnd = new Date(dateStart);
        dateEnd.setUTCHours(23, 59, 59, 999);
        where.date = { gte: dateStart, lte: dateEnd };
    }
    
    console.log("Where clause:", JSON.stringify(where, null, 2));

    const appts = await prisma.appointment.findMany({
      where,
      select: { id: true, date: true, status: true, patient: { select: { name: true } } }
    });
    
    console.log("Appointments:", appts);
  } catch (e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
