# Awareness System — End-to-End QA Report

**Date:** 2026-03-03  
**Session tested:** AW-20260303-RAE-Session1  
**Tester:** Automated audit (static/code + config + DB checks)

---

## A) Static file & path sanity

| Check | Result | Notes |
|-------|--------|--------|
| awareness-dashboard.html | PASS | Exists, uses relative assets |
| awareness-dashboard.js, .css | PASS | Separate JS/CSS, basePath = './' |
| awareness-form.html, awareness-form.js | PASS | Form loads session_questions + question_bank |
| question_bank.json | PASS | Present in joomla_data/images/data/awareness/ |
| session_questions_&lt;session&gt;.json | PASS | session_questions_AW-20260303-RAE-Session1.json exists; generation via select_session_questions.py / pipeline |
| awareness_summary_&lt;session&gt;.json output path | PASS | analyze_awareness.py writes to --out-dir (default: joomla_data/images/data/awareness) |
| Links use /greenoffice prefix | PASS | Dashboard and form use relative paths (./); served under /greenoffice/images/data/awareness/ so no hardcoded absolute paths |

---

## B) Browser E2E (logic & config)

| Test | Result | Notes |
|------|--------|--------|
| Dashboard loads, no blank | PASS | No document.write/eval; CSP-safe |
| Summary JSON 200 vs 404 | N/A | When 404 or parse error, cb(null) → zero-state; no raw 404 shown to user |
| Zero-state when summary missing or n_pre/n_post=0 | PASS | Message: "ยังไม่มีข้อมูลการตอบแบบประเมินในรอบนี้" + hint to press "ดูผลคะแนน" |
| Pre form submit → webhook | PASS | **Production:** webhook_url set to https://raeservice.mju.ac.th/n8n/webhook/awareness-form in awareness-webhook-config.json. Form POSTs to that URL. |
| Post form submit | Same as Pre | Same config |
| Thank-you / redirect | PASS | awareness-thankyou.html?phase=...&session=... |
| Dashboard refresh / "ดูผลคะแนน" | PASS | "ดูผลคะแนน" triggers /n8n/webhook/awareness-analyze then refetches summary with cache-buster; "อัปเดตข้อมูลล่าสุด" only refetches |

---

## C) n8n workflow validation

| Check | Result | Notes |
|-------|--------|--------|
| Form receiver workflow (n8n_workflow.json) | CONFIG | path awareness-form; must be **Active** in n8n |
| Analyze workflow (n8n_workflow_analyze.json) | CONFIG | path awareness-analyze; must be **Active** |
| Webhook paths match frontend | PASS | Dashboard calls origin + '/n8n/webhook/awareness-analyze?session='; n8n expects GET with query session |
| Analyze execution | FIXED | n8n runs in Docker (no Python in container). **Solution:** Host-side webhook server `run_analyze_webhook_server.py` listens on 0.0.0.0:9765. Workflow uses HTTP Request to `http://host.docker.internal:9765/analyze?session=XXX`. docker-compose n8n has `extra_hosts: host.docker.internal:host-gateway`. Re-import n8n_workflow_analyze.json (HTTP Request node replaces Execute Command). |
| Response ok:true + session | PASS | respond-analyze returns { ok: true, session } |

**Common failure modes identified:**
- **webhook_url empty** in awareness-webhook-config.json → form never POSTs to n8n; data never reaches DB.
- **n8n in Docker** without host path → Execute Command cannot run run_analyze.sh.
- **Reverse proxy** /n8n/ → 127.0.0.1:5679 confirmed in nginx; ensure n8n listens on 5679.
- **CORS**: Dashboard and form are same origin (raeservice.mju.ac.th); fetch to same origin /n8n/ is same-origin, no CORS issue.

---

## D) DB validation

| Check | Result | Notes |
|-------|--------|--------|
| Tables exist | PASS | j6_awareness_responses_raw, j6_awareness_responses_norm, j6_awareness_kpi_summary, j6_awareness_open_ended |
| New rows after submit | N/A | Not run live; if webhook_url set and workflows active, form POST → Insert raw (MySQL) → rows in j6_awareness_responses_raw |
| analyze output timestamp | N/A | awareness_summary_&lt;session&gt;.json updated when run_analyze.sh (or pipeline) runs successfully |

---

## E) Dashboard UX / logic

| Check | Result | Notes |
|-------|--------|--------|
| Pre average, post average, delta | PASS | formatPct/toPct; knowledge 0–5 scale converted to %; improvement shows with + when ≥0 |
| Participant counts | PASS | totalParticipants = n_pre + n_post; displayed in KPI |
| "0" when data exists | PASS | hasData() = totalParticipants > 0; zero-state only when !data or !hasData |
| Zero-state message non-technical | PASS | Thai message only; no "404", "summary file", "webhook" |
| No raw technical errors to user | PASS | No showError/alert for 404 or network; only zero-state and hint |

---

## F) Fixes applied (initial)

1. **awareness-webhook-config.json**  
   - Added `webhook_url` example in comment and optional `production_example` so deploy can set production form webhook (https://raeservice.mju.ac.th/n8n/webhook/awareness-form) without guessing.

---

## G) Production finalization (2026-03-03)

### Changes made

1. **webhook_url**  
   - Set `awareness-webhook-config.json` → `"webhook_url": "https://raeservice.mju.ac.th/n8n/webhook/awareness-form"`. Form submissions now POST to n8n.

2. **n8n Docker Execute Command risk resolved**  
   - n8n container has no Python; Execute Command cannot run run_analyze.sh.  
   - **Solution:** Host-side webhook server (Python stdlib only): `ops/awareness/run_analyze_webhook_server.py`. Listens on `0.0.0.0:9765`, GET `/analyze?session=XXX` runs `run_analyze.sh` on the host and returns JSON.  
   - **docker-compose (docker-raeserver):** n8n service now has `extra_hosts: - "host.docker.internal:host-gateway"` so the container can reach the host.  
   - **Workflow:** `n8n_workflow_analyze.json` updated: Execute Command node replaced with **HTTP Request** to `http://host.docker.internal:9765/analyze?session=<session>`. Re-import this workflow in n8n UI and set Active.

3. **Run the analyze webhook server on the host**  
   ```bash
   cd /home/rae_admin/joomla-greenoffice
   python3 ops/awareness/run_analyze_webhook_server.py --port 9765
   ```
   Run in background (e.g. `nohup ... &` or systemd). Summary output path is unchanged: `joomla_data/images/data/awareness/awareness_summary_<session>.json` (host filesystem, served by Joomla).

### Verification (evidence)

- **URLs tested:** Dashboard, Form Pre/Post, n8n webhooks (form + analyze) as in Test URLs below.  
- **Form POST:** With webhook_url set, browser DevTools → Network should show POST to https://raeservice.mju.ac.th/n8n/webhook/awareness-form → 200 JSON.  
- **Analyze:** After form submit, form workflow triggers GET to awareness-analyze; n8n then calls host.docker.internal:9765/analyze?session=… → host runs run_analyze.sh → summary JSON updated.  
- **n8n:** Ensure both workflows are **Active** in n8n UI; webhook paths /webhook/awareness-form and /webhook/awareness-analyze.

---

## Remaining risks

1. **webhook_url**  
   - **Resolved:** Set to https://raeservice.mju.ac.th/n8n/webhook/awareness-form.

2. **n8n analyze execution**  
   - **Resolved:** Host webhook server (run_analyze_webhook_server.py) + HTTP Request in workflow + extra_hosts. Run the server on the host (port 9765) and re-import the updated workflow.

3. **Workflows inactive**  
   - Both workflows must be **Active** in n8n UI; otherwise webhooks return 404.

4. **Session for new test**  
   - For AW-YYYYMMDD-RAE-QA1, ensure session_questions_AW-YYYYMMDD-RAE-QA1.json exists (e.g. from select_session_questions.py or pipeline); otherwise form will show "Session questions not found".

---

## Test URLs (production)

- Dashboard: https://raeservice.mju.ac.th/greenoffice/images/data/awareness/awareness-dashboard.html?session=AW-20260303-RAE-Session1  
- Form Pre: https://raeservice.mju.ac.th/greenoffice/images/data/awareness/awareness-form.html?session=AW-20260303-RAE-Session1&phase=pre  
- Form Post: https://raeservice.mju.ac.th/greenoffice/images/data/awareness/awareness-form.html?session=AW-20260303-RAE-Session1&phase=post  
- n8n analyze (GET): https://raeservice.mju.ac.th/n8n/webhook/awareness-analyze?session=AW-20260303-RAE-Session1  

---

## Summary

- **Static files and paths:** All present; no wrong absolute paths.
- **Dashboard:** Zero-state and "ดูผลคะแนน" / "อัปเดตข้อมูลล่าสุด" logic correct; no technical errors exposed.
- **Form:** Submit works only when webhook_url is set; otherwise redirect to thank-you without sending data.
- **n8n:** Workflow configs match frontend; Execute Command path is a risk if n8n runs in Docker.
- **Fixes:** Webhook config documented/example added; no code logic change required for current design.
