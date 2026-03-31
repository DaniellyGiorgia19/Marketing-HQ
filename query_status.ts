import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const contents = await prisma.content.findMany({ select: { id: true, status: true, tema: true } });
  console.log(contents);
}
main().catch(console.error).finally(() => prisma.$disconnect());
