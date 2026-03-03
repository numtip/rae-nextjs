#!/usr/bin/env bash
# new_session.sh — สร้างรอบกิจกรรม Awareness ใหม่
#
# Usage:
#   ./new_session.sh <SESSION_ID>
#   ./new_session.sh   ← auto-generate ID จากวันที่ปัจจุบัน
#
# สิ่งที่ script นี้ทำ:
#   1. สร้าง session_questions_<SESSION>.json ใน web dir (เลือก 5 คำถามแบบ deterministic)
#   2. เพิ่ม session เข้า awareness_sessions.json
#   3. แสดง URL สำหรับแจกจ่ายให้ผู้เข้าร่วม

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WEB_DIR="$REPO_ROOT/joomla_data/images/data/awareness"
BASE_URL="https://raeservice.mju.ac.th/greenoffice/images/data/awareness"

# ─── 1. กำหนด Session ID ───────────────────────────────────────────────────
if [ -n "$1" ]; then
  SESSION_ID="$1"
else
  DATE=$(date +%Y%m%d)
  # หา running number ของวันนี้
  EXISTING=$(python3 -c "
import json, re
try:
    with open('$WEB_DIR/awareness_sessions.json') as f:
        sessions = json.load(f).get('sessions', [])
    today = '${DATE}'
    nums = [int(m.group(1)) for s in sessions if (m := re.search(r'AW-' + today + r'-RAE-(\d+)', s))]
    print(max(nums) + 1 if nums else 1)
except Exception:
    print(1)
" 2>/dev/null)
  SESSION_ID="AW-${DATE}-RAE-${EXISTING}"
fi

echo "============================================"
echo "  รอบกิจกรรมใหม่: $SESSION_ID"
echo "============================================"

# ─── 2. ตรวจว่ามีอยู่แล้วหรือไม่ ──────────────────────────────────────────
SQ_WEB="$WEB_DIR/session_questions_${SESSION_ID}.json"
if [ -f "$SQ_WEB" ]; then
  echo "⚠  session_questions พบอยู่แล้ว: $SQ_WEB (ข้ามขั้นตอนนี้)"
else
  echo "[1/3] สร้าง session_questions..."
  python3 "$SCRIPT_DIR/select_session_questions.py" \
    "$SESSION_ID" \
    --out-dir "$WEB_DIR" 2>&1
  echo "  → $SQ_WEB"
fi

# ─── 3. อัปเดต awareness_sessions.json ───────────────────────────────────
SESSIONS_FILE="$WEB_DIR/awareness_sessions.json"
echo "[2/3] อัปเดต awareness_sessions.json..."
python3 - "$SESSION_ID" "$SESSIONS_FILE" << 'PYEOF'
import json, sys

session_id = sys.argv[1]
path = sys.argv[2]

try:
    with open(path) as f:
        data = json.load(f)
except FileNotFoundError:
    data = {"sessions": []}

sessions = data.get("sessions", [])
if session_id not in sessions:
    sessions.insert(0, session_id)   # เพิ่มไว้บนสุด (ล่าสุดก่อน)
    data["sessions"] = sessions
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"  เพิ่ม '{session_id}' เข้า sessions แล้ว (รวม {len(sessions)} รอบ)")
else:
    print(f"  '{session_id}' มีอยู่แล้ว (รวม {len(sessions)} รอบ)")
PYEOF

# ─── 4. Sync question_bank.json (ตรวจว่าตรงกัน) ───────────────────────────
echo "[3/3] ตรวจ question_bank sync..."
OPS_BANK="$SCRIPT_DIR/content/question_bank.json"
WEB_BANK="$WEB_DIR/question_bank.json"
if [ -f "$OPS_BANK" ]; then
  OPS_MD5=$(md5sum "$OPS_BANK" | cut -d' ' -f1)
  WEB_MD5=$(md5sum "$WEB_BANK" 2>/dev/null | cut -d' ' -f1 || echo "")
  if [ "$OPS_MD5" != "$WEB_MD5" ]; then
    cp "$OPS_BANK" "$WEB_BANK"
    echo "  question_bank.json อัปเดตแล้ว"
  else
    echo "  question_bank.json ✓ ตรงกันแล้ว"
  fi
fi

# ─── แสดง URLs ────────────────────────────────────────────────────────────
S_ENC=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SESSION_ID'))")
echo ""
echo "============================================"
echo "  ✅ พร้อมใช้งาน!"
echo "============================================"
echo ""
echo "  📋 แจก URL ให้ผู้เข้าร่วม:"
echo "  $BASE_URL/awareness-index.html?session=${S_ENC}"
echo ""
echo "  หรือแยก Pre/Post:"
echo "  Pre:  $BASE_URL/awareness-form.html?session=${S_ENC}&phase=pre"
echo "  Post: $BASE_URL/awareness-form.html?session=${S_ENC}&phase=post"
echo ""
echo "  📊 Dashboard (ผู้ดูแล):"
echo "  $BASE_URL/awareness-dashboard.html?session=${S_ENC}"
echo ""
echo "  ℹ  คะแนนจะอัปเดตอัตโนมัติทุก 5 นาที (PM2 cron)"
echo "     หรือรันเองทันที:"
echo "     DB_HOST=172.23.0.2 python3 ops/awareness/analyze_awareness.py --session $SESSION_ID"
echo ""
