import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const bus = await prisma.business.create({
    data: { nome_marca: "T2", nome_interno: "T" }
  });
  const cmp = await prisma.campaign.create({
    data: { business_id: bus.id, nome: "C1", objetivo: "Awareness" }
  });
  const cnt = await prisma.content.create({
    data: { campaign_id: cmp.id, tema: "P1", status: "PENDENTE" }
  });
  console.log(cnt.id);
}
main().finally(() => prisma.$disconnect());
