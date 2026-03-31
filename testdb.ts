import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.content.findMany();
  console.log("CONTENTS =>", c.map(x => ({ id: x.id, status: x.status })));
}
main().finally(() => prisma.$disconnect());
