# การตรวจสอบส่วน Awareness ใน Executive Dashboard

## ไฟล์ที่แก้ไข
- `executive-dashboard.html`: เพิ่ม nav link "Awareness", section แบบประเมินกิจกรรมปลูกจิตสำนึก (Awareness) และเครื่องมือระบบ

## URL ที่ใช้ (relative to live_site /greenoffice)
- เปิด Pre: `/greenoffice/images/data/awareness/awareness-form.html?session=<session_id>&phase=pre`
- เปิด Post: `/greenoffice/images/data/awareness/awareness-form.html?session=<session_id>&phase=post`
- question_bank.json: `/greenoffice/images/data/awareness/question_bank.json`
- session_questions: `/greenoffice/images/data/awareness/session_questions_<session_id>.json` (session_id ถูก sanitize เป็น safe สำหรับชื่อไฟล์)
- รายงานผล: `/greenoffice/images/data/awareness/awareness-dashboard.html`
- n8n: `/n8n/`

## วิธีตรวจสอบในเบราว์เซอร์
1. เปิด Executive Dashboard: `https://raeservice.mju.ac.th/greenoffice/images/data/executive/executive-dashboard.html` (หรือ URL ที่ deploy จริง)
2. คลิกเมนู "Awareness" ให้ scroll ไปที่การ์ด "แบบประเมินกิจกรรมปลูกจิตสำนึก (Awareness)"
3. ตรวจสอบ: ช่อง session_id เต็มด้วยค่าเริ่มต้น AW-YYYYMMDD-RAE-Session1 (ตามวันที่ของเครื่อง)
4. คลิก "สร้าง session_id วันนี้" → ค่าช่องอัปเดตเป็นวันปัจจุบัน
5. คลิก "เปิด Pre" → เปิดแท็บใหม่ไปที่ awareness-form.html?session=...&phase=pre
6. คลิก "เปิด Post" → เปิดแท็บใหม่ไปที่ awareness-form.html?session=...&phase=post
7. คลิก "คัดลอกลิงก์ Pre" / "คัดลอกลิงก์ Post" → แสดง alert ว่าคัดลอกแล้ว (ต้องใช้ใน HTTPS หรือ localhost เพื่อ clipboard API)
8. ลิงก์ "session_questions_<session>.json" ต้องชี้ไปที่ไฟล์ตาม session_id ปัจจุบัน (แม้จะ 404 ถ้ายังไม่มีไฟล์สำหรับ session นั้น รูปแบบ URL ต้องถูกต้อง)
9. เครื่องมือระบบ: ลิงก์ n8n และรายงานผล Awareness เปิดในแท็บใหม่

## หมายเหตุ
- สคริปต์เป็น inline ใน HTML ไม่ใช้ eval หรือ external lib เพิ่ม
- ลิงก์ทั้งหมดใช้ prefix `/greenoffice` ตาม live_site subpath
