import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const departmentSeeds = [
  { id: 'dept-planner', name: 'Planner', description: 'Project planning and task breakdown', icon: '📐', color: '#6c5ce7', sortOrder: 1 },
  { id: 'dept-architect', name: 'Architect', description: 'System design and technical decisions', icon: '🏗️', color: '#a29bfe', sortOrder: 2 },
  { id: 'dept-developer', name: 'Developer', description: 'Code implementation and features', icon: '💻', color: '#0984e3', sortOrder: 3 },
  { id: 'dept-tester', name: 'Tester', description: 'Quality assurance and testing', icon: '🧪', color: '#00b894', sortOrder: 4 },
  { id: 'dept-reviewer', name: 'Reviewer', description: 'Code review and feedback', icon: '🔍', color: '#e17055', sortOrder: 5 },
  { id: 'dept-devops', name: 'DevOps', description: 'CI/CD, deployment, infrastructure', icon: '🚀', color: '#636e72', sortOrder: 6 },
];

const agentSeeds = [
  {
    id: 'agent-siam',
    name: 'Siam',
    role: 'backend',
    status: 'idle',
    model: 'claude-sonnet-4-20250514',
    department: 'backend',
    task: null,
    displayConfig: {
      role: 'Backend Engineer',
      colorTheme: 't-blue',
      hairStyle: 'hair-short',
      hairColor: 'hair-dark',
      screenType: 'coding',
      mouth: 'happy',
      avatar: { bg: 'linear-gradient(135deg,#74b9ff,#0984e3)', letter: 'S' },
    },
    stats: { tasks: 24, success: '96%', avgTime: '18m', tokPerMin: 1250 },
    configJson: {
      systemPrompt: 'You are Siam, a senior backend engineer at Tiwa. You specialize in Node.js, NestJS, TypeScript, PostgreSQL, and REST API design. Write clean, production-ready code with proper error handling. Explain your approach briefly before providing code.',
    },
  },
  {
    id: 'agent-nara',
    name: 'Nara',
    role: 'backend',
    status: 'idle',
    model: 'claude-opus-4-20250514',
    department: 'backend',
    task: null,
    displayConfig: {
      role: 'DB Architect',
      colorTheme: 't-purple',
      hairStyle: 'hair-long',
      hairColor: 'hair-brown',
      screenType: 'coding',
      mouth: 'think',
      avatar: { bg: 'linear-gradient(135deg,#a29bfe,#6c5ce7)', letter: 'N' },
    },
    stats: { tasks: 18, success: '100%', avgTime: '25m', tokPerMin: 980 },
    configJson: {
      systemPrompt: 'You are Nara, a database architect at Tiwa. You specialize in database schema design, query optimization, Prisma ORM, PostgreSQL, and MongoDB. Provide thoughtful, well-reasoned database solutions.',
    },
  },
  {
    id: 'agent-karn',
    name: 'Karn',
    role: 'frontend',
    status: 'idle',
    model: 'claude-sonnet-4-20250514',
    department: 'frontend',
    task: null,
    displayConfig: {
      role: 'Frontend Engineer',
      colorTheme: 't-orange',
      hairStyle: 'hair-spiky',
      hairColor: 'hair-red',
      screenType: 'designing',
      mouth: 'happy',
      avatar: { bg: 'linear-gradient(135deg,#fdcb6e,#e17055)', letter: 'K' },
    },
    stats: { tasks: 31, success: '94%', avgTime: '15m', tokPerMin: 1100 },
    configJson: {
      systemPrompt: 'You are Karn, a frontend engineer at Tiwa. You specialize in React, Next.js, TypeScript, and Tailwind CSS. Build responsive, accessible, and performant UI components. Explain your approach briefly.',
    },
  },
  {
    id: 'agent-ploy',
    name: 'Ploy',
    role: 'frontend',
    status: 'idle',
    model: 'claude-sonnet-4-20250514',
    department: 'frontend',
    task: null,
    displayConfig: {
      role: 'UI/UX Specialist',
      colorTheme: 't-pink',
      hairStyle: 'hair-bun',
      hairColor: 'hair-purple',
      screenType: 'designing',
      mouth: 'happy',
      avatar: { bg: 'linear-gradient(135deg,#fd79a8,#e84393)', letter: 'P' },
    },
    stats: { tasks: 22, success: '98%', avgTime: '12m', tokPerMin: 1340 },
    configJson: {
      systemPrompt: 'You are Ploy, a UI/UX specialist at Tiwa. You specialize in design systems, component styling, animations, and user experience. Create beautiful, intuitive interfaces with clean CSS.',
    },
  },
  {
    id: 'agent-tawan',
    name: 'Tawan',
    role: 'qa',
    status: 'idle',
    model: 'claude-haiku-35-20241022',
    department: 'qa',
    task: null,
    displayConfig: {
      role: 'QA Engineer',
      colorTheme: 't-green',
      hairStyle: 'hair-short',
      hairColor: 'hair-brown',
      screenType: 'testing',
      mouth: 'neutral',
      avatar: { bg: 'linear-gradient(135deg,#00b894,#00cec9)', letter: 'T' },
    },
    stats: { tasks: 45, success: '92%', avgTime: '8m', tokPerMin: 2100 },
    configJson: {
      systemPrompt: 'You are Tawan, a QA engineer at Tiwa. You write thorough test cases using Jest and Testing Library. Identify edge cases, write unit and integration tests, and provide detailed test reports.',
    },
  },
  {
    id: 'agent-mali',
    name: 'Mali',
    role: 'reviewer',
    status: 'idle',
    model: 'claude-opus-4-20250514',
    department: 'qa',
    task: null,
    displayConfig: {
      role: 'Code Reviewer',
      colorTheme: 't-red',
      hairStyle: 'hair-long',
      hairColor: 'hair-red',
      screenType: 'coding',
      mouth: 'neutral',
      avatar: { bg: 'linear-gradient(135deg,#e17055,#d63031)', letter: 'M' },
    },
    stats: { tasks: 15, success: '87%', avgTime: '22m', tokPerMin: 890 },
    configJson: {
      systemPrompt: 'You are Mali, a senior code reviewer at Tiwa. Review code for correctness, security vulnerabilities, performance issues, and maintainability. Provide specific, actionable feedback.',
    },
  },
  {
    id: 'agent-dao',
    name: 'Dao',
    role: 'devops',
    status: 'idle',
    model: 'claude-sonnet-4-20250514',
    department: 'devops',
    task: null,
    displayConfig: {
      role: 'DevOps Engineer',
      colorTheme: 't-gray',
      hairStyle: 'hair-short',
      hairColor: 'hair-gray',
      screenType: 'idle',
      mouth: 'neutral',
      avatar: { bg: 'linear-gradient(135deg,#636e72,#2d3436)', letter: 'D' },
    },
    stats: { tasks: 12, success: '100%', avgTime: '30m', tokPerMin: 750 },
    configJson: {
      systemPrompt: 'You are Dao, a DevOps engineer at Tiwa. You specialize in Docker, Kubernetes, CI/CD pipelines, and cloud infrastructure. Provide deployment configurations and infrastructure-as-code solutions.',
    },
  },
  {
    id: 'agent-rin',
    name: 'Rin',
    role: 'devops',
    status: 'idle',
    model: 'claude-opus-4-20250514',
    department: 'devops',
    task: null,
    displayConfig: {
      role: 'Infra Specialist',
      colorTheme: 't-teal',
      hairStyle: 'hair-bun',
      hairColor: 'hair-teal',
      screenType: 'infra',
      mouth: 'happy',
      avatar: { bg: 'linear-gradient(135deg,#00cec9,#0984e3)', letter: 'R' },
    },
    stats: { tasks: 20, success: '95%', avgTime: '20m', tokPerMin: 1050 },
    configJson: {
      systemPrompt: 'You are Rin, an infrastructure specialist at Tiwa. You specialize in monitoring, scaling, security hardening, and infrastructure optimization. Provide robust infrastructure solutions.',
    },
  },
];

const taskSeeds = [
  { title: 'Create user authentication API', type: 'code', status: 'pending', priority: 'high', agentId: null },
  { title: 'Design login page', type: 'code', status: 'pending', priority: 'medium', agentId: null },
  { title: 'Setup CI/CD pipeline', type: 'deploy', status: 'pending', priority: 'high', agentId: null },
  { title: 'POST /api/users endpoint', type: 'code', status: 'in_progress', priority: 'high', agentId: 'agent-siam' },
  { title: 'Building dashboard layout', type: 'code', status: 'in_progress', priority: 'medium', agentId: 'agent-karn' },
  { title: 'User schema optimization', type: 'plan', status: 'in_progress', priority: 'high', agentId: 'agent-nara' },
  { title: 'Review auth middleware', type: 'review', status: 'review', priority: 'high', agentId: 'agent-tawan' },
  { title: 'Test payment integration', type: 'test', status: 'review', priority: 'critical', agentId: 'agent-tawan' },
  { title: 'Setup monitoring alerts', type: 'deploy', status: 'completed', priority: 'medium', agentId: 'agent-rin' },
  { title: 'Implement rate limiting', type: 'code', status: 'completed', priority: 'high', agentId: 'agent-siam' },
  { title: 'Deploy staging env', type: 'deploy', status: 'completed', priority: 'medium', agentId: 'agent-dao' },
  { title: 'Fix CSS responsive layout', type: 'fix', status: 'completed', priority: 'low', agentId: 'agent-ploy' },
];

async function main() {
  console.log('Seeding database...');

  // Create project
  const project = await prisma.project.upsert({
    where: { name: 'Tiwa Platform' },
    update: {},
    create: {
      id: 'project-tiwa',
      name: 'Tiwa Platform',
      description: 'AI Orchestrator System - Main Platform',
      status: 'active',
      gitRepoJson: JSON.stringify({ url: 'https://github.com/user/tiwa', branch: 'main' }),
      workspacePath: '/workspace/tiwa',
    },
  });
  console.log(`  Project: ${project.name}`);

  // Create departments
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

  // Create agents
  for (const seed of agentSeeds) {
    const dc = JSON.stringify(seed.displayConfig);
    const st = JSON.stringify(seed.stats);
    const cj = JSON.stringify(seed.configJson || {});
    await prisma.agent.upsert({
      where: { id: seed.id },
      update: {
        status: seed.status,
        task: seed.task,
        displayConfig: dc,
        stats: st,
        configJson: cj,
      },
      create: {
        id: seed.id,
        name: seed.name,
        role: seed.role,
        status: seed.status,
        model: seed.model,
        department: seed.department,
        task: seed.task || null,
        displayConfig: dc,
        stats: st,
        configJson: cj,
      },
    });
    console.log(`  Agent: ${seed.name} (${seed.status})`);
  }

  // Create workflow
  const workflow = await prisma.workflow.upsert({
    where: { id: 'workflow-main' },
    update: {},
    create: {
      id: 'workflow-main',
      name: 'Main Pipeline',
      description: 'Primary development workflow',
      projectId: project.id,
      status: 'running',
      currentStepIndex: 2,
      startedAt: new Date(),
      stepsJson: JSON.stringify([
        { id: 's1', name: 'Requirement', taskType: 'plan', agentRole: 'planner', dependsOn: [] },
        { id: 's2', name: 'Planning', taskType: 'plan', agentRole: 'planner', dependsOn: ['s1'] },
        { id: 's3', name: 'Development', taskType: 'code', agentRole: 'backend', dependsOn: ['s2'] },
        { id: 's4', name: 'Testing', taskType: 'test', agentRole: 'qa', dependsOn: ['s3'] },
        { id: 's5', name: 'Review', taskType: 'review', agentRole: 'reviewer', dependsOn: ['s4'] },
        { id: 's6', name: 'Deploy', taskType: 'deploy', agentRole: 'devops', dependsOn: ['s5'] },
      ]),
    },
  });
  console.log(`  Workflow: ${workflow.name}`);

  // Create tasks
  for (const seed of taskSeeds) {
    const id = `task-${seed.title.toLowerCase().replace(/\s+/g, '-').slice(0, 30)}`;
    await prisma.task.upsert({
      where: { id },
      update: { status: seed.status },
      create: {
        id,
        title: seed.title,
        type: seed.type,
        status: seed.status,
        priority: seed.priority,
        assignedAgentId: seed.agentId,
        projectId: project.id,
        workflowId: workflow.id,
        startedAt: ['in_progress', 'review'].includes(seed.status) ? new Date() : null,
        completedAt: seed.status === 'completed' ? new Date() : null,
      },
    });
    console.log(`  Task: ${seed.title} (${seed.status})`);
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
