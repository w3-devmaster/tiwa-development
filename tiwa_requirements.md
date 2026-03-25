# 🌤️ Tiwa (ทิวา)
## AI Orchestrator System

### 🧩 Description
Tiwa (ทิวา) คือระบบสำหรับบริหารจัดการองค์กรที่มี “พนักงานเป็น AI ทั้งหมด”
โดยควบคุม วางแผน สั่งงาน และตรวจสอบการทำงานของ AI แต่ละตัว
เพื่อผลิตงาน Software Development แบบ end-to-end

---

# 🏢 Tiwa (ทิวา) - AI Organization Monitor System

## 🎯 Objective
สร้างหน้าจอ Monitor ภาพรวมของระบบ Tiwa ให้มีลักษณะเหมือน “บริษัทจริง”
โดยแสดงแต่ละฝ่ายงานเป็น “ห้อง (Rooms)” และมี AI Agent ทำงานอยู่ภายใน
สามารถดูสถานะ, ติดตามงาน, สื่อสาร, และควบคุมได้แบบ Real-time

## Monitor Requirements
- แสดง Organization View เป็นห้อง (Rooms)
- แต่ละ Room แทน Department (Backend, Frontend, QA, DevOps)
- แสดง AI Agent ภายในห้อง
- แสดงสถานะแบบ real-time (working, idle, error, blocked)
- แสดง log / activity live
- แสดง progress และ task flow
- รองรับการ click เข้าไปดู detail
- รองรับการ chat กับ agent
- รองรับการสั่งงาน agent
- รองรับการตั้งชื่อ AI (custom name)
- รองรับ animation (thinking, working, error)
- รองรับ screenshot/visual inspection

---

# 📌 Core Requirements

## 1. Project Management
- สร้าง project ใหม่ผ่าน GitHub
- clone project จาก GitHub
- ตั้งชื่อ project และ metadata
- รองรับ branch (main/dev/feature)
- auto branch ต่อ task
- commit / push / PR อัตโนมัติ

## 2. Workspace Management
- เลือก workspace directory ได้
- แยก workspace ต่อ project / task
- reset/clean workspace
- รองรับ Docker isolation

## 3. AI Agent Management
- รองรับหลาย role (Planner, Backend, QA ฯลฯ)
- กำหนด model ต่อ agent
- กำหนด prompt template
- กำหนด tools
- ตั้งชื่อ agent ได้

## 4. Task & Workflow
- รับ requirement จาก user
- แตก task อัตโนมัติ
- multi-step workflow
- retry / cancel task
- track progress

## 5. Orchestrator
- คุม flow agent
- route งานตาม role
- manage state
- loop (fix/test)
- queue (BullMQ)

## 6. Code Execution
- read/write file
- run command
- run test / build
- manage env

## 7. Testing System
- lint / typecheck
- unit / integration / e2e
- visual test
- test report
- AI วิเคราะห์ผล

## 8. Code Review
- AI reviewer
- requirement coverage
- edge case check
- block merge

## 9. UI/UX Validation
- layout check
- responsive
- state (loading/error)
- screenshot review

## 10. Monitoring System
- real-time logs
- task history
- error tracking

## 11. Agent Interaction
- chat กับ agent ได้
- สั่งงาน agent ได้
- ดูสถานะงาน

## 12. Security
- sandbox execution
- isolate env
- secrets management

## 13. Integration
- GitHub API
- Figma API
- CI/CD
- Webhook

## 14. Human Control
- approve task
- override AI
- manual trigger

## 15. Scalability
- multi-project
- multi-agent
- distributed worker

---

# 🚀 Summary
Tiwa คือระบบ AI Company ที่:
- มี AI เป็นทีมงาน
- ทำงานเป็น workflow จริง
- build/test/review/deploy อัตโนมัติ
- มนุษย์ควบคุมจุดสำคัญ
