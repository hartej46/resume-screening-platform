const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.candidate.findMany({ select: { id: true, name: true, file: true } });
  console.log(all);
}
main().catch(console.error).finally(() => prisma.$disconnect());
