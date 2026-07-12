const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const apps = await prisma.application.findMany({ select: { id: true, interviewQuestions: true } });
    console.log(JSON.stringify(apps, null, 2));
}
test();
