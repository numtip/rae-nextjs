# การตรวจสอบส่วน Awareness (ปุ่มสร้างลิงก์ Pre/Post)

## หมายเหตุ
ส่วน "แบบประเมินกิจกรรมปลูกจิตสำนึก (Awareness)" อยู่บน **หน้า Awareness Dashboard** เท่านั้น (ไม่ใช่หน้า Executive/GHG)

## ไฟล์ที่แก้ไข
- `awareness/awareness-dashboard.html`: เพิ่มการ์ดแบบประเมินกิจกรรมปลูกจิตสำนึก (session_id, ปุ่มเปิด Pre/Post, คัดลอกลิงก์, ลิงก์ JSON, เครื่องมือระบบ n8n)
- `executive/executive-dashboard.html`: **ลบ** ส่วน Awareness ออก (หน้า Executive เป็นเฉพาะ GHG ไม่โยงไป Awareness)

## URL ที่ใช้
- **หน้า Awareness Dashboard (ที่ต้องเปิด):** `https://raeservice.mju.ac.th/greenoffice/images/data/awareness/awareness-dashboard.html`
- เปิด Pre: `.../awareness/awareness-form.html?session=<session_id>&phase=pre`
- เปิด Post: `.../awareness/awareness-form.html?session=<session_id>&phase=post`
- question_bank.json, session_questions_<session>.json, n8n ตามลิงก์ในหน้า

## วิธีตรวจสอบในเบราว์เซอร์
1. เปิด **Awareness Dashboard**: `https://raeservice.mju.ac.th/greenoffice/images/data/awareness/awareness-dashboard.html`
2. ด้านบนจะเห็นการ์ด "แบบประเมินกิจกรรมปลูกจิตสำนึก (Awareness)"
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
