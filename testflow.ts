import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const bus = await prisma.business.create({
    data: { nome_marca: "Teste", nome_interno: "T" }
  });
  const cmp = await prisma.campaign.create({
    data: { business_id: bus.id, nome: "Campanha 1", objetivo: "Awareness" }
  });
  const cnt = await prisma.content.create({
    data: { campaign_id: cmp.id, tema: "Post Teste", status: "PENDENTE" }
  });
  console.log("Created", cnt.id);
  
  // fetch contents
  const all = await prisma.content.findMany();
  console.log("Contents before:", all.length);

  // simulate generate status update
  await prisma.content.update({ where: { id: cnt.id }, data: { status: 'EM_PRODUCAO' } });

  const allAfter = await prisma.content.findMany();
  console.log("Contents after:", allAfter.length);
}
main().finally(() => prisma.$disconnect());
