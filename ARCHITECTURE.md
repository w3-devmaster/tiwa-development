# Tiwa - Architecture Guide

อธิบาย structure ทั้งหมดของโปรเจกต์ Tiwa แบบละเอียดทุกจุด
เพื่อให้เข้าใจว่า แต่ละไฟล์/โฟลเดอร์ทำหน้าที่อะไร และทำไมถึงวางแบบนี้

---

## สารบัญ

1. [Monorepo Structure](#1-monorepo-structure)
2. [ภาพรวม Structure](#2-ภาพรวม-structure)
3. [Root Config Files](#3-root-config-files)
4. [packages/shared — Shared Package](#4-packagesshared--shared-package)
5. [apps/backend — NestJS API](#5-appsbackend--nestjs-api)
6. [apps/frontend — Next.js Dashboard](#6-appsfrontend--nextjs-dashboard)
7. [apps/worker — Worker Process](#7-appsworker--worker-process)
8. [apps/cli — CLI Tool](#8-appscli--cli-tool)
9. [Database & Storage](#9-database--storage)
10. [Data Flow — ข้อมูลไหลอย่างไร](#10-data-flow--ข้อมูลไหลอย่างไร)
11. [AI Provider System](#11-ai-provider-system)
12. [Development Workflow](#12-development-workflow)

---

## 1. Monorepo Structure

Tiwa ใช้ **pnpm workspaces + Turborepo** จัดการ monorepo

```
tiwa/
├── apps/
│   ├── backend/       ← NestJS API + Orchestrator
│   ├── frontend/      ← Next.js Dashboard
│   ├── worker/        ← Task Worker Process
│   └── cli/           ← CLI Tool (tiwa command)
├── packages/
│   └── shared/        ← Shared types & utilities
├── turbo.json         ← Turborepo pipeline config
├── pnpm-workspace.yaml
└── package.json
```

**ทำไมใช้ Monorepo?**
- แชร์ types ระหว่าง backend/frontend/worker ผ่าน `@tiwa/shared`
- Build ทุก app พร้อมกันด้วย `turbo build`
- PR เดียวแก้ได้ทุก service

---

## 2. ภาพรวม Structure

```
tiwa/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma        ← SQLite schema (Agent, Task, Project, Workflow)
│   │   │   └── seed.ts              ← Seed 8 agents + sample tasks
│   │   ├── src/
│   │   │   ├── agents/              ← Agent CRUD + stats
│   │   │   ├── ai-provider/         ← Anthropic, OpenAI, Gemini SDK wrapper
│   │   │   ├── events/              ← WebSocket (Socket.IO) gateway
│   │   │   ├── logs/                ← Log storage (JSON file-based)
│   │   │   ├── orchestrator/        ← Task execution brain
│   │   │   ├── prisma/              ← Prisma service
│   │   │   ├── projects/            ← Project CRUD
│   │   │   ├── queue/               ← In-process task queue
│   │   │   ├── settings/            ← API key management (JSON file)
│   │   │   ├── tasks/               ← Task CRUD + board view
│   │   │   ├── workers/             ← Worker registry + heartbeat
│   │   │   ├── workflows/           ← Workflow management
│   │   │   ├── app.module.ts        ← Root module
│   │   │   └── main.ts              ← Entry point
│   │   ├── data/                    ← Runtime data (gitignored)
│   │   │   ├── tiwa.db              ← SQLite database
│   │   │   ├── settings.json        ← API keys & provider config
│   │   │   ├── logs.json            ← Activity logs
│   │   │   └── chat-messages.json   ← Chat history
│   │   └── .env                     ← DATABASE_URL="file:./data/tiwa.db"
│   │
│   ├── frontend/
│   │   └── src/
│   │       ├── app/page.tsx          ← Main page (SPA routing)
│   │       ├── components/
│   │       │   ├── office/           ← Virtual office components
│   │       │   └── pages/            ← Page views (TaskBoard, Agents, Settings, etc.)
│   │       ├── hooks/                ← React Query hooks + WebSocket
│   │       ├── lib/api.ts            ← API client
│   │       └── store/useAppStore.ts  ← Zustand state
│   │
│   ├── worker/
│   │   └── src/
│   │       ├── main.ts              ← HTTP server + heartbeat loop
│   │       ├── processor.ts         ← Task execution (CLI-based)
│   │       ├── cli-executor.ts      ← Spawn Claude Code / Codex CLI
│   │       └── cli-detector.ts      ← Detect installed CLI tools
│   │
│   └── cli/
│       └── src/
│           ├── commands/             ← start, stop, restart, worker, status, config, etc.
│           ├── core/
│           │   ├── daemon.ts         ← Process spawning, build, DB init
│           │   └── config.ts         ← ~/.tiwa/config.yml management
│           └── types/index.ts        ← CLI config schema (Zod)
│
└── packages/
    └── shared/
        └── src/index.ts              ← Shared types & constants
```

---

## 3. Root Config Files

| ไฟล์ | หน้าที่ |
|------|---------|
| `turbo.json` | Pipeline: build, dev, lint, test — กำหนด cache + dependency graph |
| `pnpm-workspace.yaml` | ระบุ `apps/*` และ `packages/*` เป็น workspace |
| `package.json` | Scripts: `dev`, `build`, `clean`, `docker:*` |
| `.env` | Environment variables (DATABASE_URL, ports, API keys) |
| `.gitignore` | ซ่อน `data/*.db`, `data/*.json`, `.env`, `node_modules`, `dist` |

---

## 4. packages/shared — Shared Package

```
packages/shared/
├── src/index.ts     ← Export types & constants
├── package.json     ← name: "@tiwa/shared"
└── tsconfig.json
```

ใช้ใน backend, frontend, worker, cli ด้วย `"@tiwa/shared": "workspace:*"`

---

## 5. apps/backend — NestJS API

### Entry Point

```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.enableCors({ origin: process.env.FRONTEND_URL || '*' });
await app.listen(process.env.BACKEND_PORT || 4001, '0.0.0.0');
```

### Module Map

```
AppModule
├── ConfigModule          ← .env loading (isGlobal)
├── PrismaModule          ← SQLite database access
├── EventsModule          ← WebSocket gateway (Socket.IO)
├── SettingsModule        ← API key management (JSON file)
├── AiProviderModule      ← Anthropic, OpenAI, Gemini clients
├── AgentsModule          ← Agent CRUD + real-time status
├── TasksModule           ← Task CRUD + auto-queue
├── ProjectsModule        ← Project management
├── WorkflowsModule       ← Workflow orchestration
├── LogsModule            ← Log + chat storage (JSON files)
├── WorkersModule         ← Worker registry + heartbeat
├── OrchestratorModule    ← Task execution brain
└── QueueModule           ← In-process task queue (Global)
```

### API Routes

| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `/health` | Health check |
| GET | `/api/agents` | List agents |
| GET | `/api/agents/stats` | Active/total/error counts |
| POST | `/api/agents` | Create agent |
| PATCH | `/api/agents/:id` | Update agent |
| GET | `/api/tasks` | List tasks (filterable) |
| GET | `/api/tasks/board` | Kanban board view |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task (auto-queue if status=queued) |
| POST | `/api/orchestrator/submit` | Submit + queue task for AI execution |
| POST | `/api/orchestrator/execute/:taskId` | Execute task immediately |
| POST | `/api/orchestrator/worker-result` | Receive task result from worker (CLI) |
| GET | `/api/orchestrator/status` | Queue & agent status |
| GET | `/api/projects` | List projects |
| GET | `/api/workflows` | List workflows |
| GET | `/api/logs` | Query logs (department, level, limit) |
| GET | `/api/logs/chat/:roomId` | Chat messages by room |
| POST | `/api/logs/chat/:roomId` | Send chat message |
| GET | `/api/workers` | List connected workers |
| POST | `/api/workers/heartbeat` | Worker heartbeat |
| GET | `/api/settings` | Get settings (keys masked) |
| PUT | `/api/settings/providers/:provider/key` | Set API key |
| DELETE | `/api/settings` | Clear all settings |
| GET | `/api/docs` | Swagger documentation |

### WebSocket Events (Socket.IO)

| Event | Direction | Payload |
|-------|-----------|---------|
| `agent:status` | Server → Client | `{ id, status, task, ... }` |
| `task:update` | Server → Client | Full task object |
| `workflow:update` | Server → Client | Workflow status |
| `log:entry` | Server → Client | Log entry |
| `worker:update` | Server → Client | Worker list |
| `chat:message` | Bidirectional | `{ roomId, sender, content }` |

### Key Services

#### OrchestratorService — สมองของระบบ

```
executeTask(taskId)
  1. โหลด task จาก DB
  2. เลือก agent (role mapping + fallback)
  3. Set agent status = working
  4. ตรวจหา connected worker:
     a. Worker available → dispatch ไป worker (CLI execution)
        → Worker spawn claude/codex CLI
        → Worker POST result กลับมา handleWorkerResult()
     b. No worker → fallback ใช้ AI API (Anthropic/OpenAI/Gemini)
  5. บันทึกผลลัพธ์ลง task.resultJson
  6. อัพเดท agent status กลับเป็น idle
  7. Emit WebSocket events

handleWorkerResult(result)
  1. รับผลจาก worker (taskId, status, content, provider, durationMs)
  2. อัพเดท task status (completed/failed)
  3. Reset agent → idle
  4. Emit WebSocket events
```

**Agent Selection Logic:**
```
Task Type → Preferred Roles
  code    → [backend, frontend]
  test    → [qa]
  review  → [reviewer, qa]
  deploy  → [devops]
  plan    → [planner, backend]
  fix     → [backend, frontend]

ลำดับ: idle agent ตรง role → idle agent ใดก็ได้ → agent ที่ว่างล่าสุด
```

#### InProcessQueueService — คิวทำงาน

```typescript
// ไม่ใช้ Redis/BullMQ — ทำงานใน process เดียวกัน
queue.add(taskId)          // เพิ่ม task เข้าคิว
queue.setProcessor(fn)     // ลงทะเบียน processor function
// ทำทีละ 1 task (sequential) — เมื่อเสร็จทำตัวถัดไป
```

#### JsonStorageService — เก็บ logs/chat

```
data/logs.json          ← max 10,000 entries, prune ถึง 5,000
data/chat-messages.json ← ไม่จำกัด
```

- In-memory cache + file sync
- Atomic write: เขียน `.tmp` แล้ว rename

#### SettingsService — จัดการ API keys

```
data/settings.json
{
  "providers": {
    "anthropic": { "apiKey": "sk-ant-..." },
    "openai": { "apiKey": "sk-..." },
    "gemini": { "authType": "api_key", "apiKey": "AIza..." }
  },
  "defaults": { "model": "claude-sonnet-4-20250514", "maxTokens": 4096 }
}
```

- Frontend เห็นแค่ key ที่ mask แล้ว (`sk-a...1234`)
- ถ้าไม่มีใน settings → fallback ไป env vars

---

## 6. apps/frontend — Next.js Dashboard

### Tech Stack

| Library | Version | หน้าที่ |
|---------|---------|---------|
| Next.js | 15 | App Router (SPA mode) |
| React | 19 | UI rendering |
| Zustand | latest | Client state (currentPage, selectedRoom, etc.) |
| TanStack Query | latest | Server state (API data fetching + cache) |
| Tailwind CSS | 4 | Styling |
| Socket.IO Client | latest | Real-time WebSocket |

### Pages (SPA — single page.tsx with tab routing)

| Tab | Component | หน้าที่ |
|-----|-----------|---------|
| Virtual Office | `OfficeView` | แสดง agents ในรูปแบบ office layout |
| Task Board | `TaskBoard` | Kanban board (todo/in_progress/review/done) |
| AI Agents | `AgentsPage` | Card view ของ 8 agents + stats |
| Projects | `ProjectsPage` | Project list |
| Workflows | `WorkflowsPage` | Multi-step workflow view |
| Testing | `TestingPage` | QA test management |
| Logs | `LogsPage` | Live activity feed (filter by department) |
| Settings | `SettingsPage` | API key management + provider config |

### State Flow

```
Zustand Store (useAppStore)
├── currentPage        ← Tab navigation
├── selectedRoom       ← Chat room selection
├── selectedTaskId     ← Task detail view
├── connectionStatus   ← WebSocket connected/disconnected
└── useMockData        ← Toggle mock/live API (default: false)

React Query
├── useAgents()        ← GET /api/agents (auto-refetch)
├── useTasks()         ← GET /api/tasks
├── useTaskBoard()     ← GET /api/tasks/board
├── useSettings()      ← GET /api/settings
└── useOrchestratorStatus() ← GET /api/orchestrator/status

WebSocket (useSocket hook)
├── Subscribe: agent:status, task:update, log:entry, etc.
└── On event → invalidate React Query cache → UI re-render
```

### API Client

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6769';
```

---

## 7. apps/worker — Worker Process

### Overview

Worker เป็น standalone Node.js HTTP server ที่ทำหน้าที่:
1. รับ task จาก backend ผ่าน HTTP
2. Execute task ผ่าน **Claude Code CLI** หรือ **Codex CLI** โดยตรง (ไม่ยิง API)
3. ส่ง heartbeat ทุก 3 วินาทีเพื่อบอก backend ว่ายังทำงานอยู่
4. Report ผลลัพธ์กลับไป backend เมื่อ task เสร็จ

```
Worker
├── HTTP Server (port 6770)
│   ├── GET /health
│   ├── GET /status
│   ├── GET /cli-tools          ← CLI tools availability info
│   ├── POST /agent/assign      ← รับ task → spawn CLI
│   └── POST /agent/update      ← อัพเดท agent config
│
├── CLI Executor
│   ├── claude -p "prompt" --output-format text --verbose
│   └── codex -q "prompt" --full-auto
│
├── Result Reporting
│   └── POST backend/api/orchestrator/worker-result
│       { workerId, taskId, status, content, provider, durationMs }
│
└── Heartbeat Loop (ทุก 3 วินาที)
    └── POST backend/api/workers/heartbeat
        { workerId, host, port, agents, status, uptime, cliTools }
```

### CLI-Based Task Execution

```
POST /agent/assign (จาก backend)
  1. รับ task data (taskId, type, title, description, agentRole)
  2. เลือก CLI provider (claude / codex)
     - ถ้า task มี provider field → ใช้ตามนั้น
     - ถ้าไม่มี → ใช้ DEFAULT_CLI_PROVIDER env var
     - Fallback → ใช้ตัวที่ available
  3. สร้าง prompt ตาม task type + agent role
  4. Spawn CLI process (child_process.spawn)
  5. Capture stdout/stderr
  6. POST result กลับไป backend (/api/orchestrator/worker-result)
```

### CLI Tools Support

| CLI | Command | Mode | ใช้สำหรับ |
|-----|---------|------|-----------|
| Claude Code | `claude -p "prompt" --output-format text` | Non-interactive print | Code gen, review, planning |
| Codex | `codex -q "prompt" --full-auto` | Quiet + auto-approve | Code gen, file editing |

**ข้อดีของ CLI mode:**
- Built-in tool use (file editing, shell commands, code analysis)
- ไม่ต้อง manage API keys — ใช้ credentials ที่ CLI จัดการเอง
- Multi-step reasoning + file manipulation ในตัว

### Heartbeat System

```
Worker → POST /api/workers/heartbeat → Backend
  payload: { workerId, host, port, agents, status, uptime, cliTools }
Backend: บันทึก worker ใน registry (in-memory)
         ถ้าไม่ได้ heartbeat 10 วินาที → mark offline
Frontend: แสดง worker status ผ่าน WebSocket
```

---

## 8. apps/cli — CLI Tool

### Commands

```bash
tiwa start              # Build backend+frontend → init DB → start services
tiwa stop               # Stop ทุก service
tiwa restart            # Stop → build → start

tiwa worker start       # Build + start worker
tiwa worker stop        # Stop worker
tiwa worker restart     # Stop → build → start worker
tiwa worker status      # แสดง worker status

tiwa status             # แสดง status ทั้งระบบ
tiwa config init        # สร้าง ~/.tiwa/config.yml
tiwa config get <key>   # อ่าน config
tiwa config set <key>   # ตั้งค่า config

tiwa project create     # สร้าง project
tiwa agent list         # แสดง agents
tiwa monitor            # Real-time monitoring
tiwa run <task>         # Execute task
```

### Daemon Management

```
~/.tiwa/
├── config.yml          ← Port settings, backend URL, etc.
├── state.json          ← Backend/Frontend PID + port
├── worker-state.json   ← Worker PID + port + backend URL
└── logs/
    ├── backend-stdout.log
    ├── backend-stderr.log
    ├── frontend-stdout.log
    ├── frontend-stderr.log
    ├── worker-stdout.log
    └── worker-stderr.log
```

### Auto-Setup Flow (tiwa start)

```
tiwa start
  1. pnpm turbo build --filter=backend --filter=frontend
  2. ตรวจ apps/backend/data/tiwa.db
     ถ้าไม่มี → prisma db push + prisma db seed
  3. Spawn backend (detached, node dist/main.js)
  4. Spawn frontend (detached, next start)
  5. บันทึก PID → ~/.tiwa/state.json
  6. เปิด browser → http://localhost:<frontend-port>
```

### Config Schema (Zod-validated)

```yaml
# ~/.tiwa/config.yml
orchestrator:
  url: "http://localhost:6769"
  timeout: 30000
backend:
  port: 6769
  host: "0.0.0.0"
  logLevel: "info"
frontend:
  port: 6768
worker:
  port: 6770
  host: "0.0.0.0"
  backendUrl: "http://localhost:6769"
  heartbeatInterval: 3000
  cliProvider: "claude"         # 'claude' | 'codex' — default CLI tool
  cliTimeout: 300000            # 5 minutes timeout per task
  cliWorkDir: ""                # default working directory (empty = cwd)
projects:
  defaultPath: "~/tiwa-projects"
```

---

## 9. Database & Storage

### SQLite (Prisma ORM)

```
apps/backend/data/tiwa.db
```

**ทำไมใช้ SQLite แทน PostgreSQL?**
- ไม่ต้องติดตั้ง database server แยก
- `tiwa start` สร้าง DB อัตโนมัติ
- Portable — ย้ายไฟล์เดียวได้ทั้ง database
- เหมาะกับ single-user development tool

### Schema

```prisma
model Agent {
  id            String    @id @default(cuid())
  name          String                          // "Siam", "Nara", etc.
  role          String    @default("backend")   // backend, frontend, qa, devops, reviewer, planner
  status        String    @default("idle")      // idle, busy, working, thinking, error, offline
  model         String    @default("claude-sonnet-4-20250514")
  department    String    @default("backend")
  task          String?                         // Current task description
  displayConfig String    @default("{}")        // JSON: avatar, color theme
  stats         String    @default("{}")        // JSON: tasks count, success rate
  configJson    String    @default("{}")        // JSON: systemPrompt
  tasks         Task[]
}

model Task {
  id              String    @id @default(cuid())
  title           String
  description     String?
  type            String    @default("code")     // code, test, review, deploy, plan, fix
  status          String    @default("pending")  // pending, queued, in_progress, review, completed, failed, cancelled
  priority        String    @default("medium")   // low, medium, high, critical
  assignedAgent   Agent?    @relation(...)
  project         Project?  @relation(...)
  workflow        Workflow? @relation(...)
  resultJson      String?                        // JSON: AI response content, model, usage
  error           String?
}

model Project {
  id            String     @id @default(cuid())
  name          String     @unique
  gitRepoJson   String     @default("{}")        // JSON: url, branch
  metadataJson  String     @default("{}")
  tasks         Task[]
  workflows     Workflow[]
}

model Workflow {
  id               String    @id @default(cuid())
  name             String
  projectId        String
  stepsJson        String    @default("[]")      // JSON: step definitions
  currentStepIndex Int       @default(0)
  tasks            Task[]
}
```

> **หมายเหตุ:** JSON fields เก็บเป็น `String` (ไม่ใช่ `Json` type) เพราะ SQLite ไม่มี native JSON column
> Services ทำ `JSON.stringify()` ตอนเขียน และ `JSON.parse()` ตอนอ่าน อัตโนมัติ

### JSON File Storage (แทน MongoDB)

| ไฟล์ | หน้าที่ | Limit |
|------|---------|-------|
| `data/logs.json` | Activity logs (agent actions, errors) | 10,000 → prune เหลือ 5,000 |
| `data/chat-messages.json` | Chat history (room-based) | ไม่จำกัด |
| `data/settings.json` | API keys, provider config, defaults | - |

**ทำไมใช้ JSON file แทน MongoDB?**
- ไม่ต้องรัน MongoDB server
- เปิดดูด้วย text editor ได้
- ลบไฟล์ = ล้างข้อมูล (ง่ายมาก)

---

## 10. Data Flow — ข้อมูลไหลอย่างไร

### Task Execution Flow

```
┌──────────┐     POST /api/orchestrator/submit
│ Frontend │ ────────────────────────────────────┐
│ (React)  │                                     │
└──────────┘                                     ▼
     ▲                                    ┌──────────────┐
     │ WebSocket                          │   Backend    │
     │ (task:update,                      │  (NestJS)    │
     │  agent:status)                     └──────┬───────┘
     │                                           │
     │                                    1. Create Task (status=queued)
     │                                    2. Emit task:update via WS
     │                                    3. Add to InProcessQueue
     │                                           │
     │                                           ▼
     │                                    ┌──────────────┐
     │                                    │   Queue      │
     │                                    │ (in-process) │
     │                                    └──────┬───────┘
     │                                           │
     │                                    4. Pop task, call executeTask()
     │                                           │
     │                                           ▼
     │                                    ┌──────────────┐
     │                                    │ Orchestrator │
     │                                    └──────┬───────┘
     │                                           │
     │                              5. Select agent (role-based)
     │                              6. Set agent status=working
     │                                           │
     │                              ┌────────────┴────────────┐
     │                              │                         │
     │                     Worker available?           No worker?
     │                              │                         │
     │                              ▼                         ▼
     │                     ┌──────────────┐          ┌──────────────┐
     │                     │    Worker    │          │ AI Provider  │
     │                     │  (CLI mode) │          │ (API fallback│
     │                     └──────┬───────┘          └──────┬───────┘
     │                            │                         │
     │                  7a. POST /agent/assign       7b. Build prompt
     │                  8a. Spawn CLI:               8b. Call LLM API
     │                      claude -p "..."          9b. Get response
     │                      codex -q "..."                  │
     │                  9a. Capture output                   │
     │                  10a. POST /worker-result             │
     │                            │                         │
     │                            └────────────┬────────────┘
     │                                         │
     │                              11. Save resultJson to task
     │                              12. Set agent status=idle
     └──────────────────────────── 13. Emit task:update + agent:status
```

> **Worker CLI mode (ทางซ้าย):** Worker spawn `claude` หรือ `codex` CLI โดยตรง — ไม่ต้องยิง API
> **API fallback (ทางขวา):** ถ้าไม่มี worker connected → ใช้ AI SDK เดิม (Anthropic/OpenAI/Gemini)

### Real-time Update Flow

```
Backend เกิด event
  → EventsGateway.emit('task:update', data)
  → Socket.IO broadcast ไปทุก client
  → Frontend useSocket hook รับ event
  → Invalidate React Query cache
  → Component re-render ด้วยข้อมูลใหม่
```

### Worker Heartbeat Flow

```
Worker (ทุก 3 วินาที)
  → POST /api/workers/heartbeat
  → Backend: บันทึก/อัพเดทใน worker registry
  → Emit worker:update ผ่าน WebSocket
  → Frontend: แสดง connected workers

ถ้า worker ไม่ส่ง heartbeat 10 วินาที
  → Backend: mark worker offline
  → ลบออกจาก registry
```

---

## 11. AI Execution System

### Execution Modes (2 ทาง)

| Mode | เมื่อใช้ | วิธีทำงาน |
|------|---------|-----------|
| **CLI Mode** (primary) | มี Worker connected | Worker spawn `claude` / `codex` CLI โดยตรง |
| **API Mode** (fallback) | ไม่มี Worker | Backend เรียก AI SDK (Anthropic/OpenAI/Gemini) |

### CLI Mode — Claude Code & Codex CLI

| CLI Tool | Command | Features |
|----------|---------|----------|
| **Claude Code** | `claude -p "prompt" --output-format text --verbose` | Multi-step reasoning, file editing, shell commands |
| **Codex** | `codex -q "prompt" --full-auto` | Code generation, auto-approve file changes |

**ข้อดีของ CLI mode:**
- ไม่ต้อง manage API keys — CLI จัดการ credentials เอง
- Built-in tool use (อ่าน/เขียนไฟล์, รัน commands)
- Multi-step reasoning ในตัว (ซับซ้อนกว่า single API call)

**Config:**
```yaml
# ~/.tiwa/config.yml
worker:
  cliProvider: claude    # 'claude' | 'codex'
  cliTimeout: 300000     # 5 min timeout
  cliWorkDir: ""         # project directory for CLI
```

### API Mode — Fallback Providers

| Provider | SDK | Models | Auth |
|----------|-----|--------|------|
| Anthropic | `@anthropic-ai/sdk` | claude-sonnet-4, claude-opus-4, claude-haiku-3.5 | API Key |
| OpenAI | `openai` | gpt-4o, gpt-4-turbo, gpt-3.5-turbo | API Key |
| Google Gemini | `@google/genai` | gemini-2.0-flash, gemini-pro | API Key / OAuth / Service Account |

### Provider Detection (API mode)

```typescript
// model name → provider
"claude-*"  → anthropic
"gpt-*"     → openai
"gemini-*"  → gemini
```

### Auth Priority (API mode)

```
1. SettingsService (data/settings.json) — ตั้งค่าผ่าน Web UI
2. Environment Variables — ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.
```

### Google Gemini Auth Methods

1. **API Key** — ง่ายที่สุด ใส่ key ใน Settings page
2. **Service Account** — อัพโหลด JSON file ผ่าน Web UI
3. **OAuth 2.0** — Login with Google ผ่าน browser flow

---

## 12. Development Workflow

### Prerequisites

- Node.js 20+
- pnpm 10+

**ไม่ต้องติดตั้ง:** PostgreSQL, MongoDB, Redis, Docker

### Quick Start

```bash
# Clone & install
git clone <repo-url> && cd tiwa
pnpm install

# Start ทุกอย่าง (build + init DB + start services)
npx tiwa start

# หรือ dev mode (hot reload)
pnpm dev
```

### Development Commands

```bash
pnpm dev              # Start ทุก app ใน dev mode (turbo)
pnpm build            # Build ทุก app
pnpm clean            # ลบ dist/ ทั้งหมด

# CLI
npx tiwa start        # Build + start production mode
npx tiwa stop         # Stop ทุก service
npx tiwa restart      # Rebuild + restart
npx tiwa status       # ดู status ทั้งระบบ
npx tiwa worker start # Start worker

# Database
cd apps/backend
npx prisma db push    # Sync schema → SQLite
npx prisma db seed    # Seed sample data
npx prisma studio     # GUI สำหรับดู/แก้ database
```

### Port Allocation

| Service | Dev Port | CLI Config Port |
|---------|----------|-----------------|
| Backend | 4001 | 6769 |
| Frontend | 4000 | 6768 |
| Worker | 6770 | 6770 |

> CLI ใช้ port จาก `~/.tiwa/config.yml` — สามารถเปลี่ยนได้ด้วย `tiwa config set`

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Package Manager | pnpm 10+ |
| Monorepo | Turborepo |
| Backend Framework | NestJS 11 |
| ORM | Prisma 6 |
| Database | SQLite |
| Frontend Framework | Next.js 15 + React 19 |
| Styling | Tailwind CSS 4 |
| State Management | Zustand + TanStack Query |
| Real-time | Socket.IO |
| AI SDKs | @anthropic-ai/sdk, openai, @google/genai |
| CLI Framework | oclif v4 |
| Validation | Zod, class-validator |

### Architecture Principles

1. **Self-Contained** — ไม่พึ่ง external services, `tiwa start` แล้วใช้ได้เลย
2. **CLI Execution** — Worker ใช้ Claude Code CLI / Codex CLI โดยตรง ไม่ต้องยิง API
3. **Graceful Fallback** — ถ้าไม่มี Worker → fallback ไป AI API อัตโนมัติ
4. **Modular** — แต่ละ domain แยก module ชัดเจน
5. **Event-Driven** — WebSocket สำหรับ real-time updates ทุกอย่าง
6. **Provider Agnostic** — รองรับหลาย AI provider/CLI tools, สลับได้
7. **File-Based Storage** — SQLite + JSON files, ลบไฟล์ = ล้างข้อมูล
8. **CLI-First** — ทุกอย่างควบคุมผ่าน `tiwa` command
