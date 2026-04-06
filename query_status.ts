import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const contents = await prisma.content.findMany({ 
    orderBy: { updated_at: 'desc' },
    take: 5 
  });
  console.log(JSON.stringify(contents, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
