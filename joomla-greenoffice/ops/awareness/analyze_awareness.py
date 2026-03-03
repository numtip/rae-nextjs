#!/usr/bin/env python3
"""
Awareness evaluation analysis: compute KPIs from raw/norm tables, export CSV/JSON.
Idempotent: upsert by response_id + phase. Outputs to joomla_data/images/data/awareness/.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import sys
from decimal import Decimal
from typing import Any


class _DecimalEncoder(json.JSONEncoder):
    def default(self, o: Any) -> Any:
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)

# DB config from env (same stack as Joomla Green Office)
DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "rgreenoff-db"),
    "port": int(os.environ.get("DB_PORT", "3306")),
    "database": os.environ.get("DB_NAME", "joomla_greenoffice"),
    "user": os.environ.get("DB_USER", "joomla_user"),
    "password": os.environ.get("DB_PASS", "joomla_pass_2026"),
    "charset": "utf8mb4",
}
TABLE_PREFIX = os.environ.get("AWARENESS_TABLE_PREFIX", "j6_awareness_")

# Answer keys for K1-K5 (legacy payload; from docs/forms/awareness_forms.md)
K_KEYS = {"K1": "D", "K2": "D", "K3": "B", "K4": "C", "K5": "D"}
# Option ID prefix: answer_key "A" -> "opt_A"; scoring uses question_id + selected_option_id vs question_bank.answer_key
OPTION_ID_PREFIX = "opt_"
LIKERT_KEYS_ATT = ["A1", "A2", "A3", "A4", "A5"]
LIKERT_KEYS_INT = ["I1", "I2", "I3", "I4", "I5"]
LIKERT_KEYS_SAT = ["S1", "S2", "S3", "S4", "S5", "S6"]
LIKERT_KEYS_BEH = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"]
OPEN_KEYS = ["O1", "O2", "O3", "O4"]


def connect_db():
    try:
        import mysql.connector
        return mysql.connector.connect(**DB_CONFIG)
    except ImportError:
        print("mysql-connector-python required: pip install mysql-connector-python", file=sys.stderr)
        raise
    except Exception as e:
        print(f"DB connection error: {e}", file=sys.stderr)
        raise


def get_payload(row: dict) -> dict:
    """Extract payload from raw row (JSON column or dict)."""
    pl = row.get("payload")
    if pl is None:
        return {}
    if isinstance(pl, dict):
        return pl
    if isinstance(pl, str):
        try:
            return json.loads(pl)
        except json.JSONDecodeError:
            return {}
    return {}


def safe_float(v: Any) -> float | None:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _load_question_bank() -> dict[str, dict]:
    """Load question_bank.json; return dict id -> question (with answer_key). Cached."""
    if _load_question_bank._cache is not None:
        return _load_question_bank._cache
    script_dir = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(script_dir, "content", "question_bank.json")
    out = {}
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        for q in data.get("questions", []):
            qid = q.get("id")
            if qid:
                out[qid] = q
    _load_question_bank._cache = out
    return out


_load_question_bank._cache = None  # type: ignore[attr-defined]


def compute_knowledge_score(payload: dict) -> int | None:
    """
    Score knowledge from payload. Supports:
    - New format: mcq_answers = [{ question_id, selected_option_id }, ...];
      compare selected_option_id to question_bank.answer_key (opt_A..opt_D).
    - Legacy: K1..K5 with A/B/C/D.
    """
    mcq = payload.get("mcq_answers")
    if isinstance(mcq, list) and len(mcq) > 0:
        bank = _load_question_bank()
        if not bank:
            return None
        total = 0
        for item in mcq:
            if not isinstance(item, dict):
                continue
            qid = item.get("question_id")
            sel = item.get("selected_option_id")
            if not qid or not sel:
                continue
            q = bank.get(str(qid))
            if not q:
                continue
            key = (q.get("answer_key") or "").strip().upper()
            if not key or len(key) != 1:
                continue
            correct_id = OPTION_ID_PREFIX + key
            if str(sel).strip() == correct_id:
                total += 1
        return total if total > 0 or len(mcq) > 0 else None
    # Legacy: K1-K5
    # Two sub-formats:
    #   (a) Letter answers A/B/C/D → compare to K_KEYS, return count correct (0-5)
    #   (b) Likert self-rating 1-5 → return average as proportional score (1.0-5.0 on same scale)
    letter_total = 0
    likert_vals: list[float] = []
    for k in range(1, 6):
        val = payload.get(f"K{k}") or payload.get("K" + str(k))
        if val is None:
            return None
        ans = str(val).strip().upper()
        if ans.isdigit():
            n = float(ans)
            if 1 <= n <= 5:
                likert_vals.append(n)
            else:
                return None
        elif ans and len(ans) == 1:
            letter_total += 1 if ans == K_KEYS[f"K{k}"] else 0
        else:
            return None
    # If all 5 values were Likert, return their average (on 1-5 scale, same as MCQ 0-5)
    if len(likert_vals) == 5:
        return round(sum(likert_vals) / 5, 2)
    # Mixed or all-letter
    if likert_vals:
        return None  # mixed format → skip
    return letter_total


def mean_likert(payload: dict, keys: list[str]) -> float | None:
    vals = []
    for key in keys:
        v = payload.get(key)
        if v is None:
            continue
        f = safe_float(v)
        if f is not None and 1 <= f <= 5:
            vals.append(f)
    if not vals:
        return None
    return round(sum(vals) / len(vals), 2)


def rate_ge4(payload: dict, keys: list[str]) -> float | None:
    vals = []
    for key in keys:
        v = payload.get(key)
        if v is None:
            continue
        f = safe_float(v)
        if f is not None and 1 <= f <= 5:
            vals.append(1 if f >= 4 else 0)
    if not vals:
        return None
    return round(100.0 * sum(vals) / len(vals), 2)


def compute_anon_id(raw_row: dict) -> str:
    """anon_id for linking pre/post/followup: from payload/raw, or hash(employee_id), or hash(session+response+phase)."""
    existing = raw_row.get("anon_id") or (get_payload(raw_row).get("anon_id") if isinstance(raw_row.get("payload"), dict) else None)
    if existing and isinstance(existing, str) and len(existing) <= 64:
        return existing.strip()
    emp = raw_row.get("employee_id")
    if emp and str(emp).strip():
        return hashlib.sha256(str(emp).strip().encode("utf-8")).hexdigest()[:32]
    session_id = raw_row.get("session_id") or ""
    response_id = raw_row.get("response_id") or ""
    phase = (raw_row.get("phase") or "").lower()
    return hashlib.sha256(f"{session_id}|{response_id}|{phase}".encode("utf-8")).hexdigest()[:32]


def normalize_row(conn, raw_row: dict) -> dict | None:
    """Build one norm row from raw row. Includes anon_id for follow-up linking."""
    payload = get_payload(raw_row)
    phase = (raw_row.get("phase") or "").lower()
    if phase not in ("pre", "post", "followup"):
        return None
    response_id = raw_row.get("response_id") or ""
    session_id = raw_row.get("session_id") or ""
    if not response_id or not session_id:
        return None

    anon_id = compute_anon_id(raw_row)
    knowledge_score = compute_knowledge_score(payload)
    attitude_mean = mean_likert(payload, LIKERT_KEYS_ATT)
    intention_mean = mean_likert(payload, LIKERT_KEYS_INT)
    intention_ge4_rate = rate_ge4(payload, LIKERT_KEYS_INT)
    satisfaction_mean = mean_likert(payload, LIKERT_KEYS_SAT) if phase == "post" else None
    behavior_mean = mean_likert(payload, LIKERT_KEYS_BEH) if phase == "followup" else None
    behavior_ge4_rate = rate_ge4(payload, LIKERT_KEYS_BEH) if phase == "followup" else None

    return {
        "response_id": response_id,
        "session_id": session_id,
        "phase": phase,
        "anon_id": anon_id,
        "knowledge_score": knowledge_score,
        "attitude_mean": attitude_mean,
        "intention_mean": intention_mean,
        "intention_ge4_rate": intention_ge4_rate,
        "satisfaction_mean": satisfaction_mean,
        "behavior_mean": behavior_mean,
        "behavior_ge4_rate": behavior_ge4_rate,
        "department": raw_row.get("department"),
        "response_date": raw_row.get("response_date"),
    }


def upsert_norm(conn, row: dict) -> None:
    """Upsert one row into awareness_responses_norm (unique: session_id, phase, response_id)."""
    cur = conn.cursor()
    tbl = TABLE_PREFIX + "responses_norm"
    sql_with_anon = f"""
        INSERT INTO {tbl} (
            response_id, session_id, phase, anon_id, knowledge_score, attitude_mean,
            intention_mean, intention_ge4_rate, satisfaction_mean, behavior_mean,
            behavior_ge4_rate, department, response_date
        ) VALUES (
            %(response_id)s, %(session_id)s, %(phase)s, %(anon_id)s, %(knowledge_score)s, %(attitude_mean)s,
            %(intention_mean)s, %(intention_ge4_rate)s, %(satisfaction_mean)s, %(behavior_mean)s,
            %(behavior_ge4_rate)s, %(department)s, %(response_date)s
        )
        ON DUPLICATE KEY UPDATE
            anon_id = VALUES(anon_id),
            knowledge_score = VALUES(knowledge_score),
            attitude_mean = VALUES(attitude_mean),
            intention_mean = VALUES(intention_mean),
            intention_ge4_rate = VALUES(intention_ge4_rate),
            satisfaction_mean = VALUES(satisfaction_mean),
            behavior_mean = VALUES(behavior_mean),
            behavior_ge4_rate = VALUES(behavior_ge4_rate),
            department = VALUES(department),
            response_date = VALUES(response_date),
            updated_at = CURRENT_TIMESTAMP
    """
    sql_no_anon = f"""
        INSERT INTO {tbl} (
            response_id, session_id, phase, knowledge_score, attitude_mean,
            intention_mean, intention_ge4_rate, satisfaction_mean, behavior_mean,
            behavior_ge4_rate, department, response_date
        ) VALUES (
            %(response_id)s, %(session_id)s, %(phase)s, %(knowledge_score)s, %(attitude_mean)s,
            %(intention_mean)s, %(intention_ge4_rate)s, %(satisfaction_mean)s, %(behavior_mean)s,
            %(behavior_ge4_rate)s, %(department)s, %(response_date)s
        )
        ON DUPLICATE KEY UPDATE
            knowledge_score = VALUES(knowledge_score),
            attitude_mean = VALUES(attitude_mean),
            intention_mean = VALUES(intention_mean),
            intention_ge4_rate = VALUES(intention_ge4_rate),
            satisfaction_mean = VALUES(satisfaction_mean),
            behavior_mean = VALUES(behavior_mean),
            behavior_ge4_rate = VALUES(behavior_ge4_rate),
            department = VALUES(department),
            response_date = VALUES(response_date),
            updated_at = CURRENT_TIMESTAMP
    """
    try:
        cur.execute(sql_with_anon, row)
    except Exception as e:
        if "anon_id" in str(e).lower() or "Unknown column" in str(e):
            cur.execute(sql_no_anon, {k: v for k, v in row.items() if k != "anon_id"})
        else:
            raise
    cur.close()
    conn.commit()


def ensure_norm_from_raw(conn) -> None:
    """Fill norm table from raw (idempotent upsert). Backfill anon_id in raw when missing."""
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(
            f"SELECT id, response_id, phase, session_id, payload, department, response_date, employee_id, anon_id FROM {TABLE_PREFIX}responses_raw"
        )
    except Exception:
        cur.execute(
            f"SELECT id, response_id, phase, session_id, payload, department, response_date, employee_id FROM {TABLE_PREFIX}responses_raw"
        )
    rows = cur.fetchall()
    cur.close()
    for r in rows:
        if "anon_id" not in r:
            r["anon_id"] = None
    raw_tbl = TABLE_PREFIX + "responses_raw"
    for r in rows:
        norm = normalize_row(conn, r)
        if norm:
            upsert_norm(conn, norm)
            # Backfill anon_id in raw if column exists and value missing
            if r.get("anon_id") is None or (isinstance(r.get("anon_id"), str) and not r.get("anon_id").strip()):
                try:
                    cur2 = conn.cursor()
                    cur2.execute(
                        f"UPDATE {raw_tbl} SET anon_id = %s WHERE id = %s",
                        (norm["anon_id"], r["id"]),
                    )
                    cur2.close()
                    conn.commit()
                except Exception:
                    pass


def session_kpis(conn, session_id: str) -> dict:
    """Compute KPI summary for one session."""
    cur = conn.cursor(dictionary=True)
    tbl = TABLE_PREFIX + "responses_norm"
    cur.execute(
        f"SELECT phase, knowledge_score, attitude_mean, intention_mean, intention_ge4_rate, behavior_ge4_rate FROM {tbl} WHERE session_id = %s",
        (session_id,),
    )
    rows = cur.fetchall()
    cur.close()

    by_phase = {"pre": [], "post": [], "followup": []}
    for r in rows:
        ph = (r.get("phase") or "").lower()
        if ph in by_phase:
            by_phase[ph].append(r)

    n_pre = len(by_phase["pre"])
    n_post = len(by_phase["post"])
    n_followup = len(by_phase["followup"])

    def avg(rows, key):
        vals = [r[key] for r in rows if r.get(key) is not None]
        return round(sum(vals) / len(vals), 2) if vals else None

    knowledge_pre_mean = avg(by_phase["pre"], "knowledge_score")
    knowledge_post_mean = avg(by_phase["post"], "knowledge_score")
    knowledge_lift = None
    if knowledge_pre_mean is not None and knowledge_post_mean is not None:
        knowledge_lift = round(knowledge_post_mean - knowledge_pre_mean, 2)

    all_att = by_phase["pre"] + by_phase["post"] + by_phase["followup"]
    attitude_mean = avg(all_att, "attitude_mean")
    intention_ge4_rate = avg(by_phase["post"], "intention_ge4_rate") or avg(by_phase["pre"], "intention_ge4_rate")
    behavior_ge4_rate = avg(by_phase["followup"], "behavior_ge4_rate")

    # Participation: post / pre if both exist, else 1
    participation_rate = None
    if n_pre > 0 and n_post > 0:
        participation_rate = round(100.0 * n_post / n_pre, 2)
    elif n_post > 0:
        participation_rate = 100.0

    # Effectiveness 0-100: K 30%, A 20%, I 30%, F 20%. Normalize each to 0-100.
    # K: lift from 0-5 scale -> 0-100: lift*20 (max lift 5 -> 100)
    # A: mean 1-5 -> (mean-1)/4*100
    # I: intention_ge4_rate already 0-100
    # F: behavior_ge4_rate already 0-100; if missing use I
    k_norm = float(knowledge_lift * 20) if knowledge_lift is not None else 50.0
    k_norm = max(0.0, min(100.0, k_norm))
    a_norm = float((attitude_mean - 1) / 4 * 100) if attitude_mean is not None else 50.0
    a_norm = max(0.0, min(100.0, a_norm))
    i_norm = float(intention_ge4_rate) if intention_ge4_rate is not None else 50.0
    f_norm = float(behavior_ge4_rate) if behavior_ge4_rate is not None else float(intention_ge4_rate or 50)
    effectiveness_score = round(k_norm * 0.3 + a_norm * 0.2 + i_norm * 0.3 + f_norm * 0.2, 2)

    return {
        "session_id": session_id,
        "n_pre": n_pre,
        "n_post": n_post,
        "n_followup": n_followup,
        "knowledge_pre_mean": knowledge_pre_mean,
        "knowledge_post_mean": knowledge_post_mean,
        "knowledge_lift": knowledge_lift,
        "attitude_mean": attitude_mean,
        "intention_ge4_rate": intention_ge4_rate,
        "behavior_ge4_rate": behavior_ge4_rate,
        "participation_rate": participation_rate,
        "effectiveness_score": effectiveness_score,
    }


def upsert_kpi_summary(conn, kpis: dict) -> None:
    tbl = TABLE_PREFIX + "kpi_summary"
    cur = conn.cursor()
    cur.execute(
        f"""
        INSERT INTO {tbl} (
            session_id, n_pre, n_post, n_followup, knowledge_pre_mean, knowledge_post_mean,
            knowledge_lift, attitude_mean, intention_ge4_rate, behavior_ge4_rate,
            participation_rate, effectiveness_score
        ) VALUES (
            %(session_id)s, %(n_pre)s, %(n_post)s, %(n_followup)s, %(knowledge_pre_mean)s, %(knowledge_post_mean)s,
            %(knowledge_lift)s, %(attitude_mean)s, %(intention_ge4_rate)s, %(behavior_ge4_rate)s,
            %(participation_rate)s, %(effectiveness_score)s
        )
        ON DUPLICATE KEY UPDATE
            n_pre = VALUES(n_pre), n_post = VALUES(n_post), n_followup = VALUES(n_followup),
            knowledge_pre_mean = VALUES(knowledge_pre_mean), knowledge_post_mean = VALUES(knowledge_post_mean),
            knowledge_lift = VALUES(knowledge_lift), attitude_mean = VALUES(attitude_mean),
            intention_ge4_rate = VALUES(intention_ge4_rate), behavior_ge4_rate = VALUES(behavior_ge4_rate),
            participation_rate = VALUES(participation_rate), effectiveness_score = VALUES(effectiveness_score),
            computed_at = CURRENT_TIMESTAMP
        """,
        kpis,
    )
    cur.close()
    conn.commit()


def extract_open_themes_rules(conn, session_id: str) -> list[dict]:
    """Rules-first: extract O1-O4 answers and simple keyword themes (no LLM)."""
    cur = conn.cursor(dictionary=True)
    cur.execute(
        f"SELECT response_id, phase, payload FROM {TABLE_PREFIX}responses_raw WHERE session_id = %s AND phase IN ('post','followup')",
        (session_id,),
    )
    rows = cur.fetchall()
    cur.close()
    themes = []
    for r in rows:
        pl = get_payload(r)
        for q in OPEN_KEYS:
            text = pl.get(q)
            if not text or not str(text).strip():
                continue
            text = str(text).strip()[:2000]
            # Simple rule: first 50 chars as "theme" label
            label = text[:50] + ("..." if len(text) > 50 else "")
            themes.append({"question_id": q, "phase": r["phase"], "response_id": r["response_id"], "answer_preview": label, "themes": ["ข้อความจากผู้ตอบ"]})
    return themes


def effectiveness_grade(score: float | None) -> str:
    """Map effectiveness 0–100 to grade."""
    if score is None:
        return "-"
    if score >= 80:
        return "ดีมาก"
    if score >= 60:
        return "ดี"
    if score >= 40:
        return "ปานกลาง"
    if score >= 20:
        return "ควรปรับปรุง"
    return "ต้องปรับปรุง"


def write_report_md(
    session_id: str,
    kpis: dict,
    themes: list[dict],
    raw_csv_path: str,
    summary_json_path: str,
    themes_json_path: str,
    out_path: str,
) -> None:
    """Write Thai executive brief (MD): participation, Pre/Post tables, KPIs, grade, top 3 actions, evidence links."""
    base = "/greenoffice/images/data/awareness"
    safe_session = re.sub(r"[^\w\-]", "_", session_id)[:64]
    csv_name = os.path.basename(raw_csv_path)
    summary_name = os.path.basename(summary_json_path)
    themes_name = os.path.basename(themes_json_path)
    report_md_name = f"awareness_report_{safe_session}.md"
    report_pdf_name = f"awareness_report_{safe_session}.pdf"
    dashboard_url = f"https://raeservice.mju.ac.th{base}/awareness-dashboard.html?session={session_id}"
    base_url = f"https://raeservice.mju.ac.th{base}"
    part_rate = kpis.get("participation_rate")
    part_str = f"{part_rate}%" if part_rate is not None else "-"
    grade = effectiveness_grade(kpis.get("effectiveness_score"))
    lines = [
        "# รายงานสรุปการประเมินกิจกรรมสร้างความตระหนัก Green Office (หมวด 2)",
        "",
        f"**รอบกิจกรรม (Session):** {session_id}",
        "",
        "## วัตถุประสงค์",
        "ประเมินผลกิจกรรมสร้างความตระหนัก Green Office ผ่านแบบสอบถาม Pre-test, Post-test และ Follow-up (30 วัน) เพื่อวัดความรู้ ทัศนคติ ความตั้งใจ และพฤติกรรมที่เปลี่ยนไป",
        "",
        "## การมีส่วนร่วม (Participation)",
        f"- **จำนวนผู้ตอบ Pre-test:** {kpis.get('n_pre', 0)} คน",
        f"- **จำนวนผู้ตอบ Post-test:** {kpis.get('n_post', 0)} คน",
        f"- **จำนวนผู้ตอบ Follow-up:** {kpis.get('n_followup', 0)} คน",
        f"- **อัตราการมีส่วนร่วม (Post/Pre):** {part_str}",
        "",
        "## ตาราง Pre / Post (ความรู้)",
        "| ระยะ | ค่าเฉลี่ยคะแนนความรู้ (0–5) |",
        "|------|----------------------------|",
        f"| Pre-test | {kpis.get('knowledge_pre_mean')} |",
        f"| Post-test | {kpis.get('knowledge_post_mean')} |",
        f"| **Knowledge Lift (Post − Pre)** | **{kpis.get('knowledge_lift')}** |",
        "",
        "## KPI หลัก",
        "| ตัวชี้วัด | ค่า |",
        "|----------|-----|",
        f"| ทัศนคติ (เฉลี่ย 1–5) | {kpis.get('attitude_mean')} |",
        f"| ความตั้งใจ ≥4 (%) | {kpis.get('intention_ge4_rate')}% |",
        f"| พฤติกรรม Follow-up ≥4 (%) | {kpis.get('behavior_ge4_rate')}% |",
        f"| **คะแนนประสิทธิผลรวม (0–100)** | **{kpis.get('effectiveness_score')}** |",
        f"| **ระดับ (Grade)** | **{grade}** |",
        "",
        "*(การแปลระดับ: 80+ ดีมาก, 60–79 ดี, 40–59 ปานกลาง, 20–39 ควรปรับปรุง, 0–19 ต้องปรับปรุง)*",
        "",
        "## สรุปเชิงคุณภาพ",
        "ข้อความปลายเปิด (O1–O4) ถูกรวบรวมและสรุปตามกฎ (rules-first); จำนวนหัวข้อที่ได้: " + str(len(themes)) + " รายการ",
        "",
        "## Top 3 แนวทางดำเนินการในเดือนถัดไป",
        "1. **ปรับเนื้อหากิจกรรม:** นำผล Knowledge Lift และความพึงพอใจไปปรับปรุงเนื้อหาและรูปแบบการอบรม",
        "2. **ส่งเสริมพฤติกรรม:** ส่งเสริมมิติที่อัตรา ≥4 ต่ำ (เช่น พฤติกรรม B1–B8) ผ่านเครื่องมือในที่ทำงานหรือรณรงค์สั้น",
        "3. **ลดอุปสรรค:** ติดตามและแก้ไขอุปสรรคจากคำถาม O4 (Follow-up) เพื่อให้ปฏิบัติได้เต็มที่",
        "",
        "## ลิงก์หลักฐาน (Evidence)",
        f"- **Dashboard:** [เปิด Dashboard]({dashboard_url})",
        f"- **CSV (ข้อมูลดิบ):** [{csv_name}]({base_url}/{csv_name})",
        f"- **Summary JSON:** [{summary_name}]({base_url}/{summary_name})",
        f"- **รายงาน MD:** [{report_md_name}]({base_url}/../reports/{report_md_name}) *(หรือจาก repo reports/)*",
        f"- **รายงาน PDF:** [{report_pdf_name}]({base_url}/../reports/{report_pdf_name}) *(ถ้ามี)*",
        "",
        "---",
        "*สร้างโดย Awareness Pipeline — idempotent rerun supported*",
    ]
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def write_raw_csv(conn, session_id: str, out_path: str) -> None:
    """Export raw responses for session to CSV (flat key-value per row)."""
    cur = conn.cursor(dictionary=True)
    cur.execute(f"SELECT * FROM {TABLE_PREFIX}responses_raw WHERE session_id = %s ORDER BY created_at", (session_id,))
    rows = cur.fetchall()
    cur.close()
    if not rows:
        return
    # Flatten: response_id, phase, session_id, + payload keys
    all_keys = set()
    for r in rows:
        pl = get_payload(r)
        all_keys.update(k for k in pl if isinstance(pl.get(k), (str, int, float, type(None))))
    all_keys = sorted(all_keys)
    fieldnames = ["response_id", "phase", "session_id", "department", "response_date", "created_at"] + all_keys
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            row = {k: r.get(k) for k in ["response_id", "phase", "session_id", "department", "response_date", "created_at"]}
            pl = get_payload(r)
            for k in all_keys:
                row[k] = pl.get(k)
            w.writerow(row)


def main():
    ap = argparse.ArgumentParser(description="Awareness analysis: normalize, KPIs, export")
    ap.add_argument("--session", default=None, help="Session ID (default: latest with data)")
    ap.add_argument("--out-dir", default=None, help="Output dir (default: joomla_data/images/data/awareness)")
    ap.add_argument("--skip-db", action="store_true", help="Skip DB (only if running without DB)")
    args = ap.parse_args()

    repo = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if args.out_dir:
        out_dir = args.out_dir
    else:
        out_dir = os.path.join(repo, "joomla_data", "images", "data", "awareness")
    os.makedirs(out_dir, exist_ok=True)

    if args.skip_db:
        print("Skipping DB (--skip-db). No outputs written.", file=sys.stderr)
        return 0

    conn = connect_db()
    try:
        ensure_norm_from_raw(conn)

        # Resolve session
        session_id = args.session
        if not session_id:
            cur = conn.cursor()
            cur.execute(f"SELECT session_id FROM {TABLE_PREFIX}responses_raw GROUP BY session_id ORDER BY MAX(created_at) DESC LIMIT 1")
            row = cur.fetchone()
            cur.close()
            if row:
                session_id = row[0]
        if not session_id:
            print("No session data in DB. Run with --session <id> or add raw responses first.", file=sys.stderr)
            return 1

        kpis = session_kpis(conn, session_id)
        upsert_kpi_summary(conn, kpis)

        # Sanitize session for filename
        safe_session = re.sub(r"[^\w\-]", "_", session_id)[:64]
        raw_csv = os.path.join(out_dir, f"awareness_raw_{safe_session}.csv")
        summary_json_path = os.path.join(out_dir, f"awareness_summary_{safe_session}.json")
        themes_json_path = os.path.join(out_dir, f"awareness_open_themes_{safe_session}.json")

        write_raw_csv(conn, session_id, raw_csv)
        kpis_with_grade = {**kpis, "effectiveness_grade": effectiveness_grade(kpis.get("effectiveness_score"))}
        with open(summary_json_path, "w", encoding="utf-8") as f:
            json.dump(
                {"session_id": session_id, "kpis": kpis_with_grade, "generated_at": __import__("datetime").datetime.utcnow().isoformat() + "Z"},
                f, ensure_ascii=False, indent=2, cls=_DecimalEncoder,
            )
        themes = extract_open_themes_rules(conn, session_id)
        with open(themes_json_path, "w", encoding="utf-8") as f:
            json.dump({"session_id": session_id, "themes": themes}, f, ensure_ascii=False, indent=2, cls=_DecimalEncoder)

        reports_dir = os.path.join(repo, "reports")
        os.makedirs(reports_dir, exist_ok=True)
        report_md_path = os.path.join(reports_dir, f"awareness_report_{safe_session}.md")
        write_report_md(session_id, kpis, themes, raw_csv, summary_json_path, themes_json_path, report_md_path)

        # List sessions for dashboard dropdown: scan summary files in out_dir
        sessions_found = []
        for name in os.listdir(out_dir):
            if name.startswith("awareness_summary_") and name.endswith(".json"):
                s = name.replace("awareness_summary_", "").replace(".json", "")
                if s and s not in sessions_found:
                    sessions_found.append(s)
        sessions_found.sort(reverse=True)
        sessions_json_path = os.path.join(out_dir, "awareness_sessions.json")
        with open(sessions_json_path, "w", encoding="utf-8") as f:
            json.dump({"sessions": sessions_found}, f, ensure_ascii=False)

        print(f"Session: {session_id}")
        print(f"  CSV: {raw_csv}")
        print(f"  Summary: {summary_json_path}")
        print(f"  Report: {report_md_path}")
        print(f"  Themes: {themes_json_path}")
        print(f"  Effectiveness: {kpis.get('effectiveness_score')}")
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
