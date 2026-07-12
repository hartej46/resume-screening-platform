const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const candidates = await prisma.candidate.findMany({ include: { applications: { include: { job: true } } } });
  console.log(JSON.stringify(candidates, null, 2));
}
main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
