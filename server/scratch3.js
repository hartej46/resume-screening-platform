const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const fakeNames = ["Alex Rivera", "Sarah Chen", "Marcus Thorne", "Elena Rodriguez", "David Miller"];
  const result = await prisma.candidate.deleteMany({
    where: {
      name: { in: fakeNames }
    }
  });
  console.log('Deleted candidates:', result);
}
main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
