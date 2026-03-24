# Tiwa CLI

> Command line interface for Tiwa AI Orchestrator System

## Installation

```bash
npm install -g @w3pep/tiwa
```

## Commands

### Config - จัดการการตั้งค่า

| Command                         | Description                                                |
| ------------------------------- | ---------------------------------------------------------- |
| `tiwa config init`              | สร้างไฟล์ config เริ่มต้นที่ `~/.tiwa/config.yml`          |
| `tiwa config get <key>`         | ดูค่า config (รองรับ dot notation เช่น `orchestrator.url`) |
| `tiwa config set <key> <value>` | แก้ไขค่า config                                            |

```bash
tiwa config init
tiwa config get orchestrator.url
tiwa config set daemon.port 5000
```

ค่าเริ่มต้น:

```yaml
orchestrator:
  url: http://localhost:4000
  timeout: 30000
daemon:
  port: 4000
  logLevel: info
projects:
  defaultPath: ~/tiwa-projects
```

---

### Daemon - Start/Stop ระบบ

| Command       | Description                                  |
| ------------- | -------------------------------------------- |
| `tiwa start`  | เริ่ม daemon process                         |
| `tiwa stop`   | หยุด daemon process                          |
| `tiwa status` | แสดงสถานะระบบ (daemon, orchestrator, agents) |

```bash
tiwa start       # เริ่มระบบ
tiwa status      # ดูสถานะ
tiwa stop        # หยุดระบบ
```

ตัวอย่าง output ของ `tiwa status`:

```
=== Tiwa Status ===

Daemon:       Running
  PID:        12345
  Port:       4000
  Uptime:     1h 23m 45s

Orchestrator: Connected
  URL:        http://localhost:4000

Agents:       3/5 active
```

---

### Agents - จัดการ AI Agents

| Command                            | Description               |
| ---------------------------------- | ------------------------- |
| `tiwa agents list`                 | แสดงรายการ agents ทั้งหมด |
| `tiwa agents rename <id> <name>`   | เปลี่ยนชื่อ agent         |
| `tiwa agents logs <id> [-n lines]` | ดู log ของ agent          |

```bash
tiwa agents list
tiwa agents rename agent-123 "Backend Agent"
tiwa agents logs agent-123 -n 50
```

Agent Roles: `planner`, `backend`, `frontend`, `qa`, `devops`, `reviewer`

---

### Project - จัดการ Projects

| Command                                       | Description                      |
| --------------------------------------------- | -------------------------------- |
| `tiwa project list`                           | แสดงรายการ projects              |
| `tiwa project create <name> [-d description]` | สร้าง project ใหม่               |
| `tiwa project clone <url>`                    | Clone project จาก Git repository |

```bash
tiwa project list
tiwa project create my-app -d "My new application"
tiwa project clone https://github.com/user/repo.git
```

---

### Workflow - รัน Workflow

| Command                                 | Description           |
| --------------------------------------- | --------------------- |
| `tiwa run <workflow> [-p project] [-w]` | รัน workflow ที่กำหนด |

```bash
tiwa run build
tiwa run deploy --project my-app
tiwa run test --project my-app --watch
```

---

### Monitor - เปิด Dashboard

| Command        | Description                        |
| -------------- | ---------------------------------- |
| `tiwa monitor` | เปิด Tiwa Monitor UI ในเบราว์เซอร์ |

```bash
tiwa monitor
```

---

## File Structure

```
~/.tiwa/
├── config.yml    # การตั้งค่าระบบ
├── state.json    # สถานะ daemon (PID, port, etc.)
└── logs/         # ไฟล์ log
```

## Development

```bash
# Clone project
git clone https://github.com/user/Tiwa.git
cd Tiwa
pnpm install

# Dev mode (ไม่ต้อง build)
node apps/cli/bin/dev.js <command>

# Build
pnpm cli:build

# Test
node apps/cli/bin/run.js <command>
```

## Requirements

- Node.js >= 20
- Tiwa Backend ต้องรันอยู่ (สำหรับคำสั่ง agents, project, run)
