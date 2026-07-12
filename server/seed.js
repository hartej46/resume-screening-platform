const prisma = require('./lib/prisma');

async function main() {
  console.log('Seeding database...');
  

  const c1 = await prisma.candidate.create({
    data: { name: 'Alex Rivera', role: 'Senior React Developer', match: 92, status: 'Top Pick', skills: ['React', 'TypeScript', 'Node.js'], applied: '2 days ago', summary: 'Senior Frontend Architect with 8+ years of experience in React and TypeScript.' }
  });
  const c2 = await prisma.candidate.create({
    data: { name: 'Sarah Chen', role: 'Backend Engineer', match: 86, status: 'Strong Match', skills: ['Python', 'PostgreSQL', 'Docker'], applied: '1 week ago', summary: 'Heavy-lifting backend specialist focused on scalable Node.js services and PostgreSQL optimization.' }
  });
  const c3 = await prisma.candidate.create({
    data: { name: 'Marcus Thorne', role: 'Solutions Architect', match: 78, status: 'Initial Screen', skills: ['AWS', 'Terraform', 'Go'], applied: '3 days ago', summary: 'Strategic thinker with a background in cloud-native solutions.' }
  });
  const c4 = await prisma.candidate.create({
    data: { name: 'Elena Rodriguez', role: 'Frontend Lead', match: 95, status: 'Shortlisted', skills: ['Vue', 'Redux', 'D3.js'], applied: '4 hours ago', summary: 'Design-centric engineer with 6 years experience in building accessible web applications.' }
  });
  const c5 = await prisma.candidate.create({
    data: { name: 'David Miller', role: 'Product Manager', match: 94, status: 'Shortlisted', skills: ['Product Strategy', 'Agile', 'SQL'], applied: '5 days ago', summary: 'Product veteran with a technical edge.' }
  });

  // Sample Applications/Analysis
  await prisma.application.create({
    data: {
      candidateId: c1.id,
      matchScore: 92,
      technicalScore: 95,
      domainRelevance: 88,
      strengths: 'React ecosystem expertise, scalable architecture design.',
      gaps: 'Limited experience with modern testing frameworks like Playwright.'
    }
  });

  // Jobs
  await prisma.job.createMany({
    data: [
      { title: 'Senior React Developer', department: 'Engineering', location: 'Remote', type: 'Full-Time', salary: '$120k - $160k', posted: '2 days ago', applicants: 48, status: 'Active', description: 'Lead our frontend architecture.', skills: ['React', 'TypeScript', 'Node.js'] },
      { title: 'Backend Engineer', department: 'Engineering', location: 'Bangalore, IN', type: 'Full-Time', salary: '₹18L - ₹28L', posted: '5 days ago', applicants: 112, status: 'Active', description: 'Design robust APIs.', skills: ['Python', 'PostgreSQL', 'Docker'] },
      { title: 'Product Manager', department: 'Product', location: 'Hybrid - Mumbai', type: 'Full-Time', salary: '₹22L - ₹35L', posted: '1 week ago', applicants: 67, status: 'Active', description: 'Drive product strategy.', skills: ['Strategy', 'Agile'] }
    ]
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
