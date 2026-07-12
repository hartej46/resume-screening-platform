const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const candidate = await prisma.candidate.findFirst({ where: { name: 'Vivek Krishna' } });
  console.log('Candidate file:', candidate?.file);
  const allCandidates = await prisma.candidate.findMany({ select: { name: true, file: true } });
  console.log('All candidates:', allCandidates);
}
main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
