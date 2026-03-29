import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const departmentSeeds = [
  { id: 'dept-planner', name: 'Planner', description: 'Project planning and task breakdown', icon: '📐', color: '#6c5ce7', sortOrder: 1 },
  { id: 'dept-architect', name: 'Architect', description: 'System design and technical decisions', icon: '🏗️', color: '#a29bfe', sortOrder: 2 },
  { id: 'dept-developer', name: 'Builder', description: 'Code implementation and features', icon: '💻', color: '#0984e3', sortOrder: 3 },
  { id: 'dept-tester', name: 'Tester', description: 'Quality assurance and testing', icon: '🧪', color: '#00b894', sortOrder: 4 },
  { id: 'dept-reviewer', name: 'Reviewer', description: 'Code review and feedback', icon: '🔍', color: '#e17055', sortOrder: 5 },
  { id: 'dept-devops', name: 'DevOps', description: 'CI/CD, deployment, infrastructure', icon: '🚀', color: '#636e72', sortOrder: 6 },
];

async function main() {
  console.log('Seeding database...');

  // Create departments only
  for (const seed of departmentSeeds) {
    await prisma.department.upsert({
      where: { id: seed.id },
      update: {
        name: seed.name,
        description: seed.description,
        icon: seed.icon,
        color: seed.color,
        sortOrder: seed.sortOrder,
      },
      create: seed,
    });
    console.log(`  Department: ${seed.icon} ${seed.name}`);
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
