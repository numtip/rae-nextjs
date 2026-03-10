# Joomla 6 GreenOffice — คู่มือสำหรับ AI Agents

เอกสารนี้ออกแบบสำหรับ **AI Agents** ที่ทำงานกับโปรเจกต์ Joomla 6 GreenOffice — อธิบาย stack โครงสร้าง paths และวิธีใช้งานที่ถูกต้อง

---

## Continuation Protocol (REQUIRED — run at start of every session)

> **Every agent must complete these 4 steps before making any changes.**

```
Step 1 — Read state
  cat MEMORY/NOW.md
  cat MEMORY/PLAN.md
  cat LOGS/$(date +%Y-%m-%d).md   # today's log, or latest if not yet created

Step 2 — Run health check
  bash: see RUNBOOK/QUICKCHECK.md
  (copy-paste and run each block; fix failures before proceeding)

Step 3 — Execute Next Actions from NOW.md
  Work top-to-bottom through "Next Actions".
  Update MEMORY/NOW.md and LOGS/<today>.md as you go.

Step 4 — End-of-session wrap
  Append to LOGS/<today>.md: Summary / Changes / Verify / Next Step
  Update MEMORY/NOW.md: Last Completed, Next Actions, Blockers
  If decision made: append one line to MEMORY/DECISIONS.md
  If risk found: update MEMORY/RISKS.md
  Commit: git add MEMORY/ LOGS/ RUNBOOK/ && git commit -m "EOD <date>: <summary>"
```

### Memory File Map
| File | Purpose |
|------|---------|
| `MEMORY/NOW.md` | Current state, last done, next actions, key IDs |
| `MEMORY/PLAN.md` | Ordered backlog |
| `MEMORY/DECISIONS.md` | Append-only one-liners |
| `MEMORY/RISKS.md` | Risk register |
| `MEMORY/CONTEXT.md` | Pointers to existing docs + key paths |
| `LOGS/<date>.md` | Dated session log (append-only) |
| `RUNBOOK/QUICKCHECK.md` | Health check commands |
| `RUNBOOK/ROLLBACK.md` | Rollback playbooks by scenario |

---

## การเรียกใช้งาน (สำหรับ Agent อื่น)

- **อ่านคู่มือนี้:** `@joomla-greenoffice/AGENTS.md`
- **Cursor Rule:** มี rule `joomla-greenoffice.mdc` ที่ใช้กับไฟล์ใน `joomla-greenoffice/**` — เปิดไฟล์ในโฟลเดอร์นี้จะโหลด context อัตโนมัติ

---

## 1. โครงสร้างโปรเจกต์

```
joomla-greenoffice/
├── docker-compose.yml              # กำหนด services
├── apache-greenoffice-vhost.conf   # Apache: Alias /greenoffice → /var/www/html
├── uploads.ini                     # PHP upload limits
├── joomla_data/                    # Joomla files (mount → /var/www/html)
│   ├── configuration.php           # Joomla config — ต้องมี owner www-data (UID 33)
│   ├── cache/                      # Cache — ต้อง writable
│   ├── administrator/              # Admin backend
│   ├── images/                     # Media
│   └── ...
├── mariadb_data/                   # MariaDB data
└── mariadb_config/                 # MySQL config
```

---

## 2. Docker Services

| Service | Container | Port | หน้าที่ |
|---------|-----------|------|---------|
| `rgreenoff` | rgreenoff | 8081:80 | Joomla 6 (PHP 8.3 + Apache) |
| `rgreenoff-db` | rgreenoff-db | - | MariaDB 10.11 สำหรับ Joomla |

### คำสั่งที่ใช้บ่อย

```bash
cd /home/rae_admin/joomla-greenoffice

# Start/Stop
docker compose up -d              # Start ทุก service
docker compose down               # Stop ทั้งหมด
docker compose up -d rgreenoff    # Start เฉพาะ Joomla

# รันคำสั่งใน container
docker exec rgreenoff <cmd>       # รันใน Joomla container
docker exec rgreenoff-db mysql ... # รัน MySQL
```

---

## 3. Joomla Configuration

| รายการ | ค่า |
|--------|-----|
| **DB Host** | `rgreenoff-db` |
| **DB Name** | `joomla_greenoffice` |
| **DB User** | `joomla_user` |
| **DB Pass** | `joomla_pass_2026` |
| **DB Prefix** | `j6_` |
| **live_site** | `https://raeservice.mju.ac.th/greenoffice` |
| **force_ssl** | `1` |

⚠️ **สำคัญ:** Joomla ทำงานใต้ subpath `/greenoffice` — ห้ามตั้ง `live_site` เป็น root (`/`)

---

## 4. Nginx (Reverse Proxy บน Host)

- **Config:** `/home/rae_admin/configs/nginx/raeservice.mju.ac.th.conf`
- **Path:** `/greenoffice/` → proxy ไป `http://127.0.0.1:8081`
- **Deploy:** `sudo cp configs/nginx/raeservice.mju.ac.th.conf /etc/nginx/sites-available/` แล้ว `sudo systemctl reload nginx`

---

## 5. URLs

| ประเภท | URL |
|--------|-----|
| **Site** | https://raeservice.mju.ac.th/greenoffice/ |
| **Admin** | https://raeservice.mju.ac.th/greenoffice/administrator/ |
| **Local (container)** | http://127.0.0.1:8081 |

---

## 6. การแก้ไขไฟล์และ Permissions

### configuration.php
- **Owner:** ต้องเป็น `www-data:www-data` (Apache เขียนได้)
- **Permission:** `664`
- แก้จาก host ไม่ได้ (owner root) → ใช้ `docker exec rgreenoff sed ...` หรือ chown ผ่าน container

### โฟลเดอร์ที่ต้อง writable
- `/var/www/html/configuration.php`
- `/var/www/html/cache/`
- `/var/www/html/administrator/logs/`
- `/var/www/html/images/`
- `/var/www/html/tmp/`

### แก้ permission ผ่าน Docker
```bash
docker exec rgreenoff chown -R www-data:www-data /var/www/html/cache
```

---

## 7. Joomla CLI (ใน container)

```bash
docker exec rgreenoff php /var/www/html/cli/joomla.php <command>
```

| Command | การใช้งาน |
|---------|-----------|
| `maintenance:database --fix` | อัปเดตโครงสร้าง DB (แก้ "tables not up to date") |
| `cache:clean` | ล้าง cache |
| `extension:list` | รายการ extensions |
| `user:list` | รายการ users |

---

## 8. การเชื่อมต่อ Database

```bash
docker exec rgreenoff-db mysql -ujoomla_user -pjoomla_pass_2026 joomla_greenoffice -e "SELECT ..."
```

---

## 9. ประเด็นที่ต้องระวัง

1. **Path `/greenoffice`** — Joomla อยู่ใน subpath ทุก URL ภายในต้องมี prefix `/greenoffice`
2. **proxy_redirect** — Nginx ต้อง rewrite เฉพาะ root (`/`) → `/greenoffice/` ไม่ใช่ทุก path
3. **Outbound HTTPS** — Container อาจเข้า update.joomla.org ไม่ได้ → ติดตั้งภาษา/extension แบบ manual upload
4. **Owner ไฟล์** — ไฟล์ใน `joomla_data` ควรเป็น `www-data` (33) หากแก้ด้วย root ต้อง chown กลับ

---

## 10. อ้างอิงไฟล์เพิ่มเติม

- `Docker_GreenOffice_Joomla6_Stack_Summary.md` — สรุป stack
- `/home/rae_admin/logs/` — รายงานและสคริปต์แก้ไขต่างๆ
# === Agent Switch Protocol (Ultra-Lean) ===

## Rule 0 — File Memory Only
Chat history is NOT reliable.
Truth lives only in:

- MEMORY/NOW.md
- MEMORY/PLAN.md
- MEMORY/DECISIONS.md
- MEMORY/RISKS.md
- LOGS/YYYY-MM-DD.md
- RUNBOOK/QUICKCHECK.md

If it is not written there, it does not exist.

---

## Resume Sequence (ANY Agent)

1. Read AGENTS.md
2. Read MEMORY/NOW.md
3. Read MEMORY/PLAN.md
4. Read latest LOGS file
5. Run RUNBOOK/QUICKCHECK.md
6. Log results
7. Execute ONLY "Next Actions" from NOW.md (in order)

No side quests.

---

## After EACH Action

Mandatory:
- Append to LOGS/<today>.md
- Update MEMORY/NOW.md
- Add verification result

No verification = not done.

Keep NOW.md ≤ 1 page.

---

## If Blocked

- Write blocker in NOW.md
- Propose max 2 safe options
- Choose safest
- Continue

Never stall.

---

## End of Day

- Finalize LOGS
- Update NOW.md (max 5 Next Actions)
- Record major decision (1 line) in DECISIONS.md
- Commit: "EOD <date>: <summary>"

---

## Safety Guardrails

- No large refactors
- No directory restructuring
- No production config changes unless required in NOW.md
- All risky changes need rollback note

Consistency > cleverness.

# === End Protocol ===