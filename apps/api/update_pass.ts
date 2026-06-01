import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@dentflow.com';
  const hashedPassword = await bcrypt.hash('Manoj@2006', 10);
  
  await prisma.user.update({
    where: { email: adminEmail },
    data: { password: hashedPassword },
  });
  
  console.log('✅ Admin password updated to Manoj@2006');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
