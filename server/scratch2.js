const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const candidates = await prisma.candidate.findMany();
  console.log(candidates.map(c => c.name).join(', '));
}
main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
