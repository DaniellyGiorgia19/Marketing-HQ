import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const c1 = await prisma.content.updateMany({
    where: { status: 'EM PRODUÇÃO' },
    data: { status: 'EM_PRODUCAO' }
  });
  console.log('Fixed EM PRODUÇÃO:', c1.count);

  const c2 = await prisma.content.updateMany({
    where: { status: 'REVISÃO' },
    data: { status: 'REVISAO' }
  });
  console.log('Fixed REVISÃO:', c2.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
