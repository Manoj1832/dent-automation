const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const today = new Date('2026-05-16T00:00:00.000Z');
    const tomorrow = new Date('2026-05-17T00:00:00.000Z');
    
    const count = await prisma.appointment.count({
      where: {
        date: { gte: today, lt: tomorrow },
        status: { notIn: ['COMPLETED', 'MISSED', 'CANCELLED'] }
      }
    });
    
    const appts = await prisma.appointment.findMany({
      where: {
        date: { gte: today, lt: tomorrow }
      },
      select: { id: true, status: true, startTime: true, patient: { select: { name: true } } }
    });
    
    console.log("Count:", count);
    console.log("Appointments:", appts);
  } catch (e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
