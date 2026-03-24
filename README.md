# Tiwa (ทิวา) - AI Orchestrator System

ระบบ AI Orchestrator สำหรับจัดการ AI Agents ให้ทำงานร่วมกัน เช่น เขียนโค้ด, ทดสอบ, รีวิว, และ deploy อัตโนมัติ

## ภาพรวมระบบ

```
                        ┌─────────────────┐
                        │   tiwa CLI      │  ← คำสั่ง command line
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │  Backend (API)  │  ← NestJS REST + WebSocket
                        │  :4000          │
                        └──┬──────────┬───┘
                           │          │
                ┌──────────▼──┐  ┌────▼──────────┐
                │  Worker     │  │  Frontend     │
                │  (BullMQ)   │  │  (Next.js)    │
                │             │  │  :3000        │
                └──────┬──────┘  └───────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
     ┌────▼───┐  ┌─────▼────┐  ┌───▼─────┐
     │PostgreSQL│  │  Redis   │  │ MongoDB │
     │  :5432  │  │  :6379   │  │  :27017 │
     └────────┘  └──────────┘  └─────────┘
```

## Apps

### CLI (`apps/cli`)

Command line tool สำหรับควบคุมระบบ Tiwa ติดตั้งผ่าน npm:

```bash
npm install -g @w3pep/tiwa
```

| Command | Description |
|---------|-------------|
| `tiwa config init` | สร้าง config เริ่มต้น (`~/.tiwa/config.yml`) |
| `tiwa config get <key>` | ดูค่า config |
| `tiwa config set <key> <value>` | แก้ค่า config |
| `tiwa start` | เริ่ม daemon |
| `tiwa stop` | หยุด daemon |
| `tiwa status` | แสดงสถานะระบบ |
| `tiwa agents list` | แสดงรายการ AI agents |
| `tiwa agents rename <id> <name>` | เปลี่ยนชื่อ agent |
| `tiwa agents logs <id>` | ดู log ของ agent |
| `tiwa project list` | แสดงรายการ projects |
| `tiwa project create <name>` | สร้าง project ใหม่ |
| `tiwa project clone <url>` | Clone จาก Git |
| `tiwa run <workflow>` | รัน workflow |
| `tiwa monitor` | เปิด dashboard ในเบราว์เซอร์ |

---

### Backend (`apps/backend`)

NestJS REST API + WebSocket server เป็นศูนย์กลางของระบบ

- **Port:** 4000
- **หน้าที่:** รับคำสั่งจาก CLI/Frontend, จัดการ agents, กระจาย tasks ลง queue
- **Tech:** NestJS, Prisma (PostgreSQL), Mongoose (MongoDB), BullMQ, Passport JWT

---

### Frontend (`apps/frontend`)

Next.js web dashboard สำหรับดูสถานะและควบคุมระบบผ่าน UI

- **Port:** 3000
- **หน้าที่:** แสดงสถานะ agents, workflows, logs แบบ real-time
- **Tech:** Next.js 15, React 19, Tailwind CSS 4, Zustand, Socket.IO, TanStack Query

---

### Worker (`apps/worker`)

Background job processor รับงานจาก queue แล้วสั่ง AI agents ทำงาน

- **หน้าที่:** ประมวลผล tasks (code, test, review, deploy)
- **Tech:** BullMQ, ioredis, Dockerode

---

## Packages

### Shared (`packages/shared`)

Types, constants, utilities ที่ใช้ร่วมกันทุก app

**Types:**

| Type | Description |
|------|-------------|
| `Agent` | AI agent (role, status, config) |
| `AgentRole` | planner, backend, frontend, qa, devops, reviewer |
| `Task` | งานที่ assign ให้ agent (code, test, review, deploy, plan, fix) |
| `Workflow` | ลำดับ steps ที่ต้องทำ |
| `Project` | โปรเจกต์ที่จัดการ (ชื่อ, Git repo, workspace path) |

**Constants:**

| Constant | Description |
|----------|-------------|
| `QUEUE_NAMES` | ชื่อ queue (tiwa:task, tiwa:code-execution, ...) |
| `WS_EVENTS` | WebSocket events (agent:status, task:update, ...) |

---

## Infrastructure

### Databases

| Database | หน้าที่ | Port |
|----------|--------|------|
| **PostgreSQL** | เก็บข้อมูลหลัก (users, projects, tasks) | 5432 |
| **Redis** | Job queue (BullMQ) + cache | 6379 |
| **MongoDB** | เก็บ logs, agent memory, unstructured data | 27017 |

### Docker

```bash
# Development (databases only)
pnpm docker:dev

# Production (all services)
pnpm docker:prod
```

---

## Project Structure

```
Tiwa/
├── apps/
│   ├── backend/          # NestJS API server
│   ├── cli/              # CLI tool (oclif)
│   ├── frontend/         # Next.js dashboard
│   └── worker/           # BullMQ job processor
├── packages/
│   └── shared/           # Shared types, constants, utils
├── docker/               # Dockerfiles
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── turbo.json            # Turborepo config
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Development

### Requirements

- Node.js >= 20
- pnpm >= 10
- Docker (สำหรับ databases)

### Setup

```bash
git clone https://github.com/user/Tiwa.git
cd Tiwa
pnpm install

# Start databases
pnpm docker:dev

# Run all apps
pnpm dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | รันทุก app พร้อมกัน |
| `pnpm build` | Build ทุก app |
| `pnpm cli:build` | Build CLI เท่านั้น |
| `pnpm docker:dev` | Start databases (PostgreSQL, Redis, MongoDB) |
| `pnpm docker:dev:down` | Stop databases |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | เปิด Prisma Studio (database GUI) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| CLI | Node.js, oclif, TypeScript |
| API | NestJS, Prisma, Passport |
| Frontend | Next.js, React, Tailwind, Zustand |
| Worker | BullMQ, ioredis, Dockerode |
| Database | PostgreSQL, Redis, MongoDB |
| Build | Turborepo, pnpm, tsup |
| Deploy | Docker Compose |

## License

MIT
