# Tiwa - Architecture Guide

อธิบาย structure ทั้งหมดของโปรเจกต์ Tiwa แบบละเอียดทุกจุด
เพื่อให้เข้าใจว่า แต่ละไฟล์/โฟลเดอร์ทำหน้าที่อะไร และทำไมถึงวางแบบนี้

---

## สารบัญ

1. [Monorepo คืออะไร](#1-monorepo-คืออะไร)
2. [ภาพรวม Structure](#2-ภาพรวม-structure)
3. [Root Config Files](#3-root-config-files)
4. [packages/shared — Shared Package](#4-packagesshared--shared-package)
5. [apps/backend — NestJS API](#5-appsbackend--nestjs-api)
6. [apps/worker — BullMQ Worker](#6-appsworker--bullmq-worker)
7. [apps/frontend — Next.js Dashboard](#7-appsfrontend--nextjs-dashboard)
8. [Docker Infrastructure](#8-docker-infrastructure)
9. [Data Flow — ข้อมูลไหลอย่างไร](#9-data-flow--ข้อมูลไหลอย่างไร)
10. [Development Workflow](#10-development-workflow)

---

## 1. Monorepo คืออะไร

### แบบเดิม (Multi-repo)

โดยปกติ ถ้าเรามีโปรเจกต์ที่ประกอบด้วย frontend, backend, worker
เราอาจแยกเป็น 3 repo:

```
tiwa-backend/    ← repo แยก
tiwa-frontend/   ← repo แยก
tiwa-worker/     ← repo แยก
```

ปัญหาคือ:
- ถ้า backend เปลี่ยน type ของ API response → ต้องไปแก้ frontend อีก repo
- ถ้ามี shared types → ต้อง publish npm package แยก แล้ว install ใน 3 repo
- ต้อง sync version กัน 3 ที่
- PR ที่กระทบหลาย service ต้องเปิดหลาย repo

### แบบ Monorepo

รวมทุกอย่างไว้ใน repo เดียว แต่แยก package ชัดเจน:

```
tiwa/
├── apps/backend/      ← NestJS API
├── apps/frontend/     ← Next.js
├── apps/worker/       ← BullMQ Worker
└── packages/shared/   ← Types, constants ที่ใช้ร่วมกัน
```

ข้อดี:
- **แก้ type ที่เดียว ใช้ได้ทุก app** — เปลี่ยน `Task` interface ใน shared ทุก app เห็นทันที
- **PR เดียวแก้ข้าม service ได้** — เช่น เพิ่ม API endpoint + หน้า UI ใน PR เดียว
- **ไม่ต้อง publish package** — ใช้ `workspace:*` link ภายใน
- **Build pipeline ฉลาด** — Turborepo รู้ว่าถ้า shared เปลี่ยน ต้อง rebuild app ที่ depend

### เครื่องมือที่ใช้

| เครื่องมือ | หน้าที่ |
|-----------|--------|
| **pnpm** | Package manager — จัดการ dependencies + workspaces |
| **Turborepo** | Build orchestrator — รัน build/dev/test ข้าม packages อย่างฉลาด |

---

## 2. ภาพรวม Structure

```
Tiwa/
├── .gitignore                 # ไฟล์ที่ git ไม่ต้อง track
├── .nvmrc                     # ระบุ Node.js version
├── .npmrc                     # ตั้งค่า pnpm
├── .env.example               # ตัวอย่าง env สำหรับ dev
├── .env.prod.example          # ตัวอย่าง env สำหรับ production
│
├── package.json               # Root package — scripts + devDependencies กลาง
├── pnpm-workspace.yaml        # บอก pnpm ว่า workspace อยู่ตรงไหน
├── pnpm-lock.yaml             # Lock file (version ที่ install จริง)
├── tsconfig.base.json         # TypeScript config กลาง ที่ทุก app extend
├── turbo.json                 # Turborepo pipeline config
│
├── apps/                      # ← แอปพลิเคชันที่ deploy ได้
│   ├── backend/               #    NestJS API server
│   ├── frontend/              #    Next.js web dashboard
│   └── worker/                #    Background job processor
│
├── packages/                  # ← Library ภายในที่ไม่ deploy แยก
│   └── shared/                #    Types, constants, utilities
│
├── docker/                    # ← Dockerfile ของแต่ละ service
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   └── worker/Dockerfile
│
├── docker-compose.dev.yml     # Docker สำหรับ dev (infra เท่านั้น)
└── docker-compose.prod.yml    # Docker สำหรับ production (ทุก service)
```

### หลักการแบ่ง `apps/` vs `packages/`

| โฟลเดอร์ | คือ | ตัวอย่าง |
|----------|-----|---------|
| `apps/` | สิ่งที่ **รันได้** และ **deploy** ได้ | API server, Web app, Worker |
| `packages/` | **Library** ที่ใช้ร่วมกัน ไม่ได้รันเอง | Shared types, UI components, utils |

---

## 3. Root Config Files

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

บอก pnpm ว่า: "ภายใน `apps/` และ `packages/` แต่ละโฟลเดอร์คือ 1 package"

ทำให้ pnpm รู้ว่า:
- `apps/backend/` → เป็น package ชื่อ `backend`
- `packages/shared/` → เป็น package ชื่อ `@tiwa/shared`
- เวลา backend ต้องการ `@tiwa/shared` → link ไปที่โฟลเดอร์จริง ไม่ต้อง download จาก npm

---

### `package.json` (root)

```
{
  "name": "tiwa",
  "private": true,          ← ป้องกันไม่ให้ publish ขึ้น npm โดยไม่ตั้งใจ
  "packageManager": "pnpm@10.11.0",  ← ล็อคเวอร์ชัน pnpm ให้ทีมใช้เหมือนกัน
  "scripts": { ... },       ← คำสั่งกลาง
  "devDependencies": { ... },  ← tools ที่ใช้ระดับ root
  "pnpm": {
    "onlyBuiltDependencies": [...]  ← อนุญาต post-install scripts
  }
}
```

**Scripts ที่สำคัญ:**

| Script | ทำอะไร |
|--------|--------|
| `pnpm dev` | รัน `turbo dev` → เริ่ม dev server ทุก app พร้อมกัน |
| `pnpm build` | รัน `turbo build` → build ทุก package ตามลำดับ dependency |
| `pnpm docker:dev` | เปิด postgres + redis + mongodb ใน Docker |
| `pnpm docker:dev:down` | ปิด Docker containers |
| `pnpm db:migrate` | รัน Prisma migration (สร้าง/อัพเดท table ใน postgres) |
| `pnpm db:studio` | เปิด Prisma Studio (GUI ดู database) |

**ทำไม devDependencies อยู่ที่ root:**
- `turbo` — ใช้รัน build pipeline ทั้ง monorepo
- `prettier` — format code ทุก package ด้วย style เดียวกัน
- `typescript` + `@types/node` — shared TypeScript compiler

---

### `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",        // compile เป็น JS version ไหน
    "module": "Node16",        // ใช้ module system แบบ Node.js
    "strict": true,            // เปิด strict mode ทุกอย่าง
    "esModuleInterop": true,   // ให้ import CommonJS ได้สะดวก
    "skipLibCheck": true,      // ไม่ check type ใน node_modules (เร็วขึ้น)
    "declaration": true,       // สร้าง .d.ts (type definitions)
    ...
  }
}
```

นี่คือ **config กลาง** ที่ทุก app/package จะ `extends` ไป:

```
tsconfig.base.json          ← ตั้งค่ากลาง
├── packages/shared/tsconfig.json     ← extends base + เพิ่ม outDir
├── apps/backend/tsconfig.json        ← extends base + เปิด decorators
├── apps/worker/tsconfig.json         ← extends base + เพิ่ม outDir
└── apps/frontend/tsconfig.json       ← extends base + เปลี่ยนเป็น Bundler
```

ข้อดี: เปลี่ยน strict rule ที่เดียว มีผลทั้งโปรเจกต์

---

### `turbo.json`

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],     // ← build package ที่ depend ก่อน
      "outputs": ["dist/**", ".next/**"]  // ← cache ผลลัพธ์
    },
    "dev": {
      "cache": false,              // ← dev ไม่ cache
      "persistent": true           // ← process ค้างอยู่ (ไม่จบ)
    }
  }
}
```

**`dependsOn: ["^build"]` คืออะไร?**

สมมติ `backend` depend on `@tiwa/shared`:
```
@tiwa/shared  →  backend
```

เครื่องหมาย `^` หมายถึง "build dependency ก่อน"
ดังนั้น: shared build ก่อน → แล้ว backend ค่อย build

**Turborepo ทำอะไรให้อัตโนมัติ:**
1. วิเคราะห์ dependency graph
2. Build ตามลำดับที่ถูกต้อง (shared → backend, frontend, worker พร้อมกัน)
3. Cache ผลลัพธ์ — ถ้าไม่มีอะไรเปลี่ยน ข้ามไป
4. รัน task ที่ไม่ depend กัน แบบขนาน (parallel)

```
pnpm build
  ├── @tiwa/shared:build    ← build ก่อน (ทุก app depend)
  │   ├── backend:build     ← build พร้อมกัน (ไม่ depend กัน)
  │   ├── frontend:build    ←
  │   └── worker:build      ←
```

---

### `.npmrc`

```ini
auto-install-peers=true        # install peer dependencies อัตโนมัติ
strict-peer-dependencies=false # ไม่ error ถ้า peer version ไม่ตรงเป๊ะ
shamefully-hoist=true          # hoist packages ขึ้น root node_modules
```

**`shamefully-hoist=true` คืออะไร?**

ปกติ pnpm จะเก็บ package แยกกันอย่างเคร่งครัด (strict isolation)
แต่บาง package (เช่น NestJS) คาดหวังว่าจะหา dependency ได้จาก root
`shamefully-hoist=true` ยก package ที่ใช้บ่อยขึ้นไปไว้ที่ `node_modules/` ระดับ root
ทำให้ทุก package เข้าถึงได้

---

### `.nvmrc`

```
24
```

บอกว่าโปรเจกต์นี้ใช้ Node.js 24
ถ้าใช้ `nvm` (Node Version Manager) แค่รัน `nvm use` มันจะอ่านไฟล์นี้แล้วสลับ version ให้

---

### `.env.example` vs `.env.prod.example`

| ไฟล์ | ใช้ตอนไหน | ค่า host |
|------|----------|----------|
| `.env.example` | Development | `localhost` (เพราะ app รันบนเครื่อง) |
| `.env.prod.example` | Production | ชื่อ Docker service เช่น `postgres`, `redis` |

**.env ไม่ถูก commit** (อยู่ใน .gitignore)
.env.example คือ **template** ให้ copy ไปใช้:

```bash
cp .env.example .env    # สร้าง .env จริงจาก template
```

---

### `.gitignore`

```gitignore
node_modules/     # dependencies — install ใหม่ได้
dist/             # build output — build ใหม่ได้
.next/            # Next.js build cache
.env              # secrets — ห้าม commit!
.turbo/           # Turborepo cache
coverage/         # test coverage reports
*.tsbuildinfo     # TypeScript incremental build cache
.DS_Store         # macOS metadata file
```

หลักการ: **อะไรที่สร้างใหม่ได้ หรือเป็น secret ไม่ต้อง commit**

---

## 4. `packages/shared` — Shared Package

### หน้าที่

เก็บ **สิ่งที่ทุก app ใช้ร่วมกัน** เพื่อไม่ต้องเขียนซ้ำ:

```
packages/shared/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # re-export ทุกอย่าง
    ├── types/
    │   ├── index.ts          # re-export types
    │   ├── agent.ts          # Agent, AgentRole, AgentStatus
    │   ├── project.ts        # Project, ProjectStatus, GitHubRepo
    │   ├── task.ts           # Task, TaskStatus, TaskType
    │   └── workflow.ts       # Workflow, WorkflowStep, WorkflowStatus
    ├── constants/
    │   └── index.ts          # QUEUE_NAMES, WS_EVENTS, defaults
    └── utils/
        └── index.ts          # generateId, sleep
```

### ตัวอย่างการใช้งาน

ใน `apps/backend/`:
```typescript
import { Task, TaskStatus, QUEUE_NAMES } from '@tiwa/shared';
```

ใน `apps/worker/`:
```typescript
import { QUEUE_NAMES, DEFAULT_WORKER_CONCURRENCY } from '@tiwa/shared';
```

ใน `apps/frontend/`:
```typescript
import { Agent, AgentStatus } from '@tiwa/shared';
```

### `workspace:*` คืออะไร

ใน `apps/backend/package.json`:
```json
{
  "dependencies": {
    "@tiwa/shared": "workspace:*"
  }
}
```

`workspace:*` บอก pnpm ว่า: "package นี้อยู่ใน workspace ของเรา ไม่ต้องไป download จาก npm"
pnpm จะ symlink `node_modules/@tiwa/shared` → `packages/shared/`

### package.json ของ shared

```json
{
  "name": "@tiwa/shared",          // ชื่อ package (ใช้ scope @tiwa/)
  "main": "./dist/index.js",       // entry point หลังจาก build
  "types": "./dist/index.d.ts",    // type definitions หลังจาก build
  "exports": {                     // modern entry point
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
}
```

**flow:**
1. เขียน TypeScript ใน `src/`
2. `pnpm build` → tsc compile เป็น JavaScript ใน `dist/`
3. app อื่นๆ import จาก `dist/` (ผ่าน `main` field)

---

### Types — ทำไมต้องกำหนด

```typescript
// types/agent.ts
export enum AgentRole {
  PLANNER = 'planner',
  BACKEND = 'backend',
  FRONTEND = 'frontend',
  QA = 'qa',
  DEVOPS = 'devops',
  REVIEWER = 'reviewer',
}
```

ถ้าไม่มี shared types:
- Backend ส่ง `{ status: "working" }` → Frontend อาจเช็ค `status === "active"` → bug!
- Worker ส่ง queue ชื่อ `"task"` → Backend listen ที่ `"tasks"` → ไม่เจอกัน!

ถ้ามี shared types:
- ทุก app ใช้ `AgentStatus.WORKING` เหมือนกัน
- ทุก app ใช้ `QUEUE_NAMES.TASK` → ค่าเดียวกันเสมอ

---

### Constants — ค่าคงที่ที่ใช้ร่วม

```typescript
// constants/index.ts
export const QUEUE_NAMES = {
  TASK: 'tiwa:task',
  CODE_EXECUTION: 'tiwa:code-execution',
  ...
} as const;
```

**`as const`** ทำให้ TypeScript รู้ค่าจริงๆ:
- ไม่มี `as const`: type = `{ TASK: string }` — อะไรก็ได้
- มี `as const`: type = `{ TASK: "tiwa:task" }` — ค่าเฉพาะเจาะจง

---

## 5. `apps/backend` — NestJS API

### หน้าที่

เป็น **Control Plane** ของระบบ Tiwa:
- รับ HTTP requests จาก frontend
- จัดการ projects, agents, tasks ใน PostgreSQL
- ส่งงานเข้า queue (Redis/BullMQ) ให้ worker
- WebSocket real-time updates กลับไป frontend

### โครงสร้างไฟล์

```
apps/backend/
├── package.json         # dependencies ของ backend
├── tsconfig.json        # TypeScript config (extends base)
├── nest-cli.json        # NestJS CLI config
└── src/
    ├── main.ts          # จุดเริ่มต้น — bootstrap app
    ├── app.module.ts    # Root module — รวม modules ทั้งหมด
    ├── app.controller.ts  # Root controller — /health endpoint
    └── app.service.ts   # Root service — business logic
```

### `main.ts` — จุดเริ่มต้น

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — อนุญาตให้ frontend (port 3000) เรียก API ได้
  app.enableCors({ origin: 'http://localhost:3000' });

  // Validation Pipe — validate request body อัตโนมัติ
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // ตัด field ที่ไม่ได้กำหนดใน DTO ออก
    forbidNonWhitelisted: true, // error ถ้าส่ง field แปลกเข้ามา
    transform: true,            // แปลง type อัตโนมัติ (string → number)
  }));

  // Swagger — สร้าง API docs อัตโนมัติ ที่ /api/docs
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(4000);
}
```

### `app.module.ts` — Root Module

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,           // ใช้ได้ทุก module ไม่ต้อง import ซ้ำ
      envFilePath: ['.env', '../../.env'],  // อ่าน .env จาก 2 ที่
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**NestJS Module System:**
```
AppModule (root)
├── ConfigModule     → อ่าน environment variables
├── (จะเพิ่ม) PrismaModule  → เชื่อม PostgreSQL
├── (จะเพิ่ม) BullModule    → เชื่อม Redis queue
├── (จะเพิ่ม) MongooseModule → เชื่อม MongoDB
├── (จะเพิ่ม) AuthModule    → JWT authentication
├── (จะเพิ่ม) ProjectModule → CRUD projects
├── (จะเพิ่ม) AgentModule   → จัดการ AI agents
└── (จะเพิ่ม) TaskModule    → จัดการ tasks/workflows
```

### tsconfig.json ของ backend

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",              // NestJS ใช้ CommonJS (require/exports)
    "emitDecoratorMetadata": true,     // NestJS ต้องการ metadata จาก decorators
    "experimentalDecorators": true     // เปิดใช้ @Module, @Controller, @Get ฯลฯ
  }
}
```

**ทำไม NestJS ใช้ CommonJS?**
NestJS ใช้ `reflect-metadata` เพื่ออ่าน type information ตอน runtime
(เช่น `constructor(private service: AppService)` — NestJS รู้ว่าต้อง inject อะไร)
สิ่งนี้ทำงานได้กับ CommonJS เท่านั้น (ยังไม่รองรับ ESM เต็มรูปแบบ)

### Key Dependencies

| Package | หน้าที่ |
|---------|--------|
| `@nestjs/core` | NestJS framework |
| `@prisma/client` | ORM เชื่อม PostgreSQL |
| `bullmq` | Queue system สำหรับส่งงานให้ worker |
| `@nestjs/websockets` + `socket.io` | Real-time communication กับ frontend |
| `passport` + `passport-jwt` | JWT authentication |
| `mongoose` | เชื่อม MongoDB (เก็บ logs, documents) |
| `class-validator` | Validate request body ด้วย decorators |
| `@nestjs/swagger` | สร้าง API docs อัตโนมัติ |

---

## 6. `apps/worker` — BullMQ Worker

### หน้าที่

เป็น **Background Job Processor** — รับงานจาก queue แล้วทำ:
- รัน AI agent สั่งเขียนโค้ด
- รัน test/build
- ทำ code review
- Deploy

### ทำไมแยก worker ออกจาก backend?

```
ถ้ารวมกัน:
┌──────────────────────────┐
│ Backend (NestJS)         │
│  - รับ HTTP requests     │  ← ถ้างาน AI ใช้เวลา 5 นาที
│  - รัน AI agent          │     API อื่นจะช้าตามไปด้วย!
│  - ส่ง WebSocket         │
└──────────────────────────┘

ถ้าแยก:
┌──────────────────┐     Queue     ┌──────────────────┐
│ Backend (NestJS) │ ──────────▶  │ Worker           │
│  - รับ requests  │   (Redis)    │  - รัน AI agent  │
│  - ส่ง WebSocket │ ◀──────────  │  - รัน test/build│
│  - จัดการ data   │   (Result)   │  - code review   │
└──────────────────┘              └──────────────────┘
```

ข้อดีของการแยก:
1. **Backend เร็วเสมอ** — ไม่ถูก block โดยงานหนัก
2. **Scale แยกกัน** — ถ้างานเยอะ เพิ่ม worker ได้โดยไม่ต้องเพิ่ม backend
3. **Crash แยกกัน** — worker crash ไม่กระทบ API
4. **Memory แยกกัน** — AI task อาจใช้ RAM เยอะ ไม่กระทบ API

### โครงสร้างไฟล์

```
apps/worker/
├── package.json
├── tsconfig.json
└── src/
    ├── main.ts         # สร้าง Worker instance, connect Redis
    └── processor.ts    # Logic จัดการแต่ละ job type
```

### `main.ts` — Worker Bootstrap

```typescript
// กำหนดการเชื่อมต่อ Redis (BullMQ ใช้ Redis เป็น message broker)
const connection = {
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null,  // BullMQ ต้องการค่านี้เป็น null
};

// สร้าง Worker ที่ listen queue ชื่อ "tiwa:task"
const worker = new Worker(QUEUE_NAMES.TASK, processJob, {
  connection,
  concurrency,  // จำนวน job ที่รันพร้อมกัน (default: 3)
});
```

**BullMQ Flow:**
```
1. Frontend: "สร้าง login page"
2. Backend: สร้าง Task ใน DB → ส่ง Job เข้า Redis queue
3. Worker: หยิบ Job จาก queue → รัน AI agent → อัพเดทผลลัพธ์
4. Backend: รับผลลัพธ์ → ส่ง WebSocket update ไป frontend
```

### `processor.ts` — Job Handler

```typescript
export async function processJob(job: Job<TaskJobData>) {
  switch (job.data.type) {
    case 'code':    return handleCodeTask(...);     // AI เขียนโค้ด
    case 'test':    return handleTestTask(...);     // รัน test suite
    case 'review':  return handleReviewTask(...);   // AI review โค้ด
    case 'deploy':  return handleDeployTask(...);   // deploy
  }
}
```

### Graceful Shutdown

```typescript
async function shutdown() {
  await worker.close();   // รอ job ที่กำลังรันเสร็จ ไม่ตัดกลางคัน
  process.exit(0);
}
process.on('SIGTERM', shutdown);  // Docker stop signal
process.on('SIGINT', shutdown);   // Ctrl+C
```

ทำไมต้อง graceful shutdown? เพราะถ้า worker ถูก kill กลางคัน:
- Job ที่กำลังรันจะ fail
- ข้อมูลอาจเขียนไม่ครบ
- ต้อง retry ใหม่ทั้งหมด

### ทำไม worker ไม่ใช้ NestJS?

| | NestJS | Plain Node.js |
|---|--------|---------------|
| RAM | ~80-120 MB | ~30-50 MB |
| Startup | ~2-3 วินาที | ~0.5 วินาที |
| HTTP server | มี (ไม่จำเป็น) | ไม่มี (ดี!) |
| DI container | มี (overhead) | ไม่มี |

Worker ไม่ต้องรับ HTTP → ไม่ต้องการ NestJS overhead
แค่ต้อง connect Redis + process jobs → Plain Node.js เพียงพอ

---

## 7. `apps/frontend` — Next.js Dashboard

### หน้าที่

เป็น **Dashboard UI** ที่แสดง:
- Organization view แบบ virtual office
- AI agent status real-time
- Task progress & workflow
- Chat กับ agent
- Logs & monitoring

### โครงสร้างไฟล์

```
apps/frontend/
├── package.json
├── tsconfig.json
├── next.config.ts        # Next.js configuration
├── postcss.config.mjs    # PostCSS config (สำหรับ Tailwind)
└── src/
    └── app/              # ← App Router (Next.js 13+)
        ├── globals.css   # Tailwind CSS imports
        ├── layout.tsx    # Root layout (HTML shell)
        └── page.tsx      # หน้า Home
```

### `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',                      // สร้าง self-contained server
  transpilePackages: ['@tiwa/shared'],       // compile shared package ด้วย
};
```

**`output: 'standalone'` คืออะไร?**

ปกติ Next.js build ได้โฟลเดอร์ `.next/` ที่ต้องใช้คู่กับ `node_modules/`
แต่ `standalone` จะ copy เฉพาะไฟล์ที่จำเป็นมารวมกัน → Deploy ง่าย ภายใน Docker image เล็ก

**`transpilePackages` คืออะไร?**

`@tiwa/shared` เป็น package ภายใน monorepo
Next.js ต้องรู้ว่าต้อง compile package นี้ด้วย (ไม่ใช่ skip เหมือน node_modules ปกติ)

### App Router vs Pages Router

```
Next.js มี 2 แบบ:

Pages Router (เก่า):           App Router (ใหม่):
pages/                         src/app/
├── index.tsx → /              ├── page.tsx → /
├── about.tsx → /about         ├── about/page.tsx → /about
└── api/                       ├── layout.tsx → shared layout
    └── health.ts              └── loading.tsx → loading UI
```

เราใช้ **App Router** (อยู่ใน `src/app/`) เพราะ:
- รองรับ React Server Components
- Layout system ดีกว่า
- Loading/Error UI built-in
- เป็น standard ของ Next.js 15

### `layout.tsx` — Root Layout

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
```

ทุกหน้าจะถูกครอบด้วย layout นี้
เหมือน `_app.tsx` ใน Pages Router — เป็นที่วาง providers, global styles, navigation

### `globals.css` — Tailwind CSS v4

```css
@import 'tailwindcss';
```

Tailwind v4 ใช้ CSS-first config — แค่ import ก็พร้อมใช้
(ไม่ต้องสร้าง `tailwind.config.js` เหมือน v3)

### Key Dependencies

| Package | หน้าที่ |
|---------|--------|
| `next` | React framework — SSR, routing, API routes |
| `react` + `react-dom` | UI library |
| `tailwindcss` | Utility-first CSS framework |
| `zustand` | State management (เบากว่า Redux มาก) |
| `@tanstack/react-query` | Server state management — caching, refetching |
| `socket.io-client` | WebSocket client สำหรับ real-time updates |

---

## 8. Docker Infrastructure

### ทำไมต้องใช้ Docker

Tiwa ต้องการ 3 databases: PostgreSQL, Redis, MongoDB
แทนที่จะ install ทีละตัวบนเครื่อง → ใช้ Docker รันทั้ง 3 ด้วยคำสั่งเดียว

### `docker-compose.dev.yml` — Development

```
┌─────────────────────────────────────────────┐
│ Docker (docker-compose.dev.yml)             │
│                                             │
│  ┌───────────┐ ┌───────┐ ┌──────────────┐  │
│  │ PostgreSQL│ │ Redis │ │   MongoDB    │  │
│  │ :5432     │ │ :6379 │ │   :27017     │  │
│  └───────────┘ └───────┘ └──────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
        ↕              ↕            ↕
┌─────────────────────────────────────────────┐
│ Native (pnpm dev)                           │
│                                             │
│  Backend :4000   Frontend :3000   Worker    │
│                                             │
└─────────────────────────────────────────────┘
```

**ทำไม dev compose รันแค่ databases?**

ถ้ารัน backend ใน Docker → แก้โค้ด 1 บรรทัด → ต้อง rebuild image → ช้า!
ถ้ารัน backend native (pnpm dev) → แก้โค้ด → hot-reload ทันที (~1 วินาที)

โดยเฉพาะบน macOS — Docker volume mount ช้ากว่า native filesystem มาก

### Health Checks

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U tiwa"]
  interval: 10s      # เช็คทุก 10 วินาที
  timeout: 5s        # ถ้าไม่ตอบใน 5 วินาที ถือว่า fail
  retries: 5         # fail 5 ครั้งติด = unhealthy
```

ทำไมต้องมี?
- Docker รู้ว่า container **healthy จริง** ไม่ใช่แค่ process รันอยู่
- `depends_on: condition: service_healthy` ใน prod compose → backend จะเริ่มต่อเมื่อ DB พร้อมจริงๆ

### Volumes

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

Docker container เป็น ephemeral — ลบแล้วข้อมูลหาย
Volume เก็บข้อมูลถาวร — ลบ container แล้วสร้างใหม่ ข้อมูลยังอยู่

### `docker-compose.prod.yml` — Production

ต่างจาก dev:

| ส่วน | Dev | Production |
|------|-----|-----------|
| Services | 3 (databases) | 6 (databases + apps) |
| Restart | `unless-stopped` | `always` |
| Ports DB | เปิด (debug ได้) | ไม่เปิด (เข้าจากภายในเท่านั้น) |
| Redis password | ไม่มี | บังคับ |
| Resource limits | ไม่มี | กำหนด memory |
| Start period | ไม่มี | มี (ให้เวลา warm up) |
| Apps | รัน native | รันใน Docker container |

### Dockerfiles — Multi-stage Build

```dockerfile
# Stage 1: Base — ติดตั้ง pnpm
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

# Stage 2: Dependencies — install node_modules
FROM base AS deps
COPY package.json pnpm-lock.yaml ...
RUN pnpm install --frozen-lockfile

# Stage 3: Build — compile TypeScript
FROM deps AS build
COPY src/ ...
RUN pnpm build

# Stage 4: Production deps — install เฉพาะ production deps
FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --prod

# Stage 5: Runtime — image สุดท้ายที่ deploy
FROM node:24-alpine AS runtime
COPY --from=prod-deps ...    # เฉพาะ prod dependencies
COPY --from=build ...        # เฉพาะ compiled code
USER tiwa                    # ไม่รันเป็น root (security)
CMD ["node", "dist/main.js"]
```

**ทำไมต้อง multi-stage?**

```
ถ้า single stage:
  node:24-alpine + devDependencies + source code + build output
  = ~800 MB

ถ้า multi-stage:
  node:24-alpine + prodDependencies + build output เท่านั้น
  = ~200 MB
```

เฉพาะสิ่งที่จำเป็นต้อง deploy เท่านั้นที่อยู่ใน image สุดท้าย

### Non-root User

```dockerfile
RUN addgroup -S tiwa && adduser -S tiwa -G tiwa
USER tiwa
```

Security best practice: ไม่รัน container เป็น root
ถ้า container ถูก hack → attacker ได้แค่สิทธิ์ user ธรรมดา ไม่ใช่ root

---

## 9. Data Flow — ข้อมูลไหลอย่างไร

### ภาพรวม

```
User (Browser)
    │
    ▼
┌──────────────────┐
│ Frontend (Next.js)│ ─── REST API ──▶ ┌──────────────────┐
│ :3000            │                   │ Backend (NestJS) │
│                  │ ◀── WebSocket ─── │ :4000            │
└──────────────────┘                   └──────────────────┘
                                              │
                           ┌──────────────────┼──────────────────┐
                           ▼                  ▼                  ▼
                    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
                    │ PostgreSQL  │   │    Redis    │   │  MongoDB    │
                    │ :5432       │   │    :6379    │   │  :27017     │
                    │             │   │             │   │             │
                    │ - Projects  │   │ - BullMQ    │   │ - Logs      │
                    │ - Agents    │   │   Queue     │   │ - Outputs   │
                    │ - Tasks     │   │ - Cache     │   │ - Documents │
                    │ - Users     │   │ - Pub/Sub   │   │ - Raw data  │
                    │ - Workflows │   │ - Sessions  │   │             │
                    └─────────────┘   └──────┬──────┘   └─────────────┘
                                             │
                                             ▼
                                     ┌──────────────────┐
                                     │ Worker (BullMQ)  │
                                     │                  │
                                     │ - AI code gen    │
                                     │ - Run tests      │
                                     │ - Code review    │
                                     │ - Deploy         │
                                     └──────────────────┘
```

### ตัวอย่าง: User สั่ง "สร้าง Login Page"

```
1. User พิมพ์ "สร้าง login page" ใน dashboard
   └─▶ Frontend ส่ง POST /api/tasks { title: "สร้าง login page" }

2. Backend รับ request
   ├─▶ สร้าง Task record ใน PostgreSQL
   ├─▶ สร้าง Job ใน Redis queue (BullMQ)
   └─▶ ส่ง WebSocket event "task:update" → Frontend แสดง "Queued"

3. Worker หยิบ Job จาก Redis queue
   ├─▶ เรียก AI API (Claude/GPT) ให้เขียนโค้ด
   ├─▶ เขียนไฟล์ลง workspace
   ├─▶ บันทึก log ลง MongoDB
   └─▶ อัพเดท Job status ใน Redis

4. Backend รับ event ว่า Job เสร็จ
   ├─▶ อัพเดท Task status ใน PostgreSQL
   └─▶ ส่ง WebSocket event → Frontend แสดง "Completed"

5. Frontend อัพเดท UI real-time
   └─▶ แสดงผลงาน + log ของ agent
```

### ทำไมใช้ 3 Databases

| Database | เหมาะกับ | ตัวอย่างข้อมูล |
|----------|---------|---------------|
| **PostgreSQL** | ข้อมูลที่มี relation, ต้อง query ซับซ้อน | Projects, Tasks, Agents, Users |
| **Redis** | ข้อมูลชั่วคราว, queue, cache | BullMQ jobs, sessions, rate limits |
| **MongoDB** | ข้อมูลที่โครงสร้างไม่แน่นอน, ขนาดใหญ่ | Logs, AI outputs, raw documents |

---

## 10. Development Workflow

### เริ่มต้นพัฒนา

```bash
# 1. Clone repo
git clone <repo-url>
cd tiwa

# 2. Install dependencies
pnpm install

# 3. ตั้งค่า environment
cp .env.example .env

# 4. เปิด databases
pnpm docker:dev

# 5. (ครั้งแรก) สร้าง database tables
pnpm db:migrate

# 6. เริ่ม dev server ทุก app
pnpm dev
```

### คำสั่งที่ใช้บ่อย

```bash
# Development
pnpm dev                    # เริ่มทุก app (backend + frontend + worker)
pnpm docker:dev             # เปิด databases
pnpm docker:dev:down        # ปิด databases
pnpm docker:dev:logs        # ดู database logs

# Build & Test
pnpm build                  # build ทุก package
pnpm lint                   # lint ทุก package
pnpm test                   # test ทุก package

# Database
pnpm db:migrate             # สร้าง/อัพเดท tables
pnpm db:studio              # เปิด GUI ดู database

# รัน app เดียว
pnpm --filter backend dev   # เฉพาะ backend
pnpm --filter frontend dev  # เฉพาะ frontend
pnpm --filter worker dev    # เฉพาะ worker

# Production
pnpm docker:prod            # build + deploy ทุก service
pnpm docker:prod:down       # ปิดทุก service
```

### Git Branching

```
main                ← production-ready
└── dev             ← development branch
    ├── feature/xxx ← feature branches
    └── fix/xxx     ← bug fix branches
```
