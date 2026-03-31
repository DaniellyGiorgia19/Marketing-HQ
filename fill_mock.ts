import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const mockText = "Aqui está o conteúdo gerado pelos agentes do Opensquad com base no seu objetivo.\n\n📍 **Chamada:** O que você precisa saber hoje!\n\nVocê sabia que utilizar automação pode economizar até 30% do seu tempo operacional mensal? Focar no que realmente importa é o primeiro passo para o crescimento.\n\nClique no link e saiba como podemos ajudar.\n\n#Inovacao #Resultados";

async function main() {
  await prisma.content.updateMany({
    where: { tema: 'Post Teste', texto_gerado: null },
    data: { texto_gerado: mockText }
  });
  console.log("Updated mock text for Post Teste");
}
main().finally(() => prisma.$disconnect());
