const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const term = 'Sudhan';
    const results = await prisma.$queryRaw`
        SELECT id, "patientId", name, phone,
               GREATEST(
                 similarity(name, ${term}),
                 similarity("patientId", ${term}),
                 similarity(COALESCE(phone, ''), ${term})
               ) AS similarity
        FROM patients
        WHERE isArchived = false
          AND (
            name % ${term}
            OR "patientId" ILIKE ${`${term}%`}
            OR phone LIKE ${`%${term}%`}
          )
        ORDER BY similarity DESC
        LIMIT 8
      `;
    console.log(results);
  } catch (e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
