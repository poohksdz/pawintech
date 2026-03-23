# PRD - Admin Backend (All Admin Pages/Features)

## Goal
ทดสอบระบบหลังบ้านฝั่ง Admin (Backend) โดยยืนยันว่า API ที่ต้องใช้สิทธิ์ admin ทำงานได้จริงและป้องกัน unauthorized/non-admin ได้ถูกต้อง

## Authentication
- ใช้ JWT token ผ่าน Bearer token (Authorization header) โดยค่า token ใส่ในช่อง Credential ของหน้า Testing Configuration แล้วให้ระบบนำไปใช้กับทุกคำขอ
- Expected:
  - ไม่มี token ⇒ ได้สถานะ 401
  - มี token แต่ไม่ใช่ admin ⇒ ได้สถานะ 403
  - มี token ของ admin ที่ถูกต้อง ⇒ Endpoint ที่อนุญาตควรตอบ 2xx

## Scope (All Admin Backend Features)
ทดสอบ endpoint ที่ถูกป้องกันด้วย middleware `protect` + `admin` ทั้งหมดในโปรเจกต์นี้ ตัวอย่างเช่น (แต่ไม่จำกัดแค่รายการนี้):

- Users (การจัดการผู้ใช้)
  - `GET /api/users`
  - `GET /api/users/:id`
  - `PUT /api/users/:id`
  - `DELETE /api/users/:id`
  - `PUT /api/users/:id/staff`

- Orders & Payments
  - Order PCB admin endpoints ภายใต้ `/api/orderpcbs` ที่มี `protect, admin`
  - Payment endpoints ที่ `/api/payments` ซึ่งใช้ `protect, admin`

- Blogs, Folios, Showcases, Services
  - ทุก route ภายใต้ `/api/blogs`, `/api/folios`, `/api/showcases`, `/api/services` ที่มี `protect, admin` เช่นสร้าง/แก้ไข/ลบ/อัปเดตสถานะการแสดงผล

- Quotations & Invoices Defaults
  - เส้นทางที่ใช้ `protect, admin` ใน `/api/quotations` และ `/api/defaultquotations` รวมถึง `/api/defaultinvoices`

- Stock / Inventory Admin
  - Endpoints ใน `/api/stockproducts`, `/api/stockcategories`, `/api/stocksubcategories`, `/api/stockfootprints`, `/api/stockmanufactures`, `/api/stocksuppliers`, `/api/stockrequests`, `/api/stockissues`, `/api/stockreceives` ที่ต้องใช้ `protect, admin` หรือ `protect, admin, store`

## Test Expectations
- สำหรับทุก endpoint ที่อนุญาตให้ admin ใช้งาน:
  - ตอบกลับด้วย HTTP 200/201/204 ตามประเภทการทำงาน (อ่าน/สร้าง/แก้ไข/ลบ)
  - โครงสร้าง response มีฟิลด์หลักที่สอดคล้องกับประเภทข้อมูล (เช่น user, order, blog, showcase ฯลฯ)
- ทดสอบกรณีผิดพลาดหลักๆ:
  - ไม่ส่ง Authorization header หรือส่ง token ว่าง ⇒ ควรได้ 401
  - ใช้ token ที่ไม่ใช่ admin (ถ้ามีเคส) ⇒ ควรได้ 403

## Out of Scope
- การทดสอบ UI/หน้าจอ React (Frontend) โดยตรง
- การตรวจสอบรูปแบบ HTML/CSS หรือการเรนเดอร์หน้าเว็บ

## Notes / Data Safety
- สำหรับ endpoint ที่สร้าง/แก้ไข/ลบข้อมูล ให้โฟกัสดูว่าคำขอสำเร็จและไม่เกิด error ฝั่งเซิร์ฟเวอร์ (5xx) หรือ auth (401/403) โดยไม่จำเป็นต้องตรวจเชิงลึกของข้อมูลทุกฟิลด์
- หากพบ error ที่เกี่ยวข้องกับสภาพแวดล้อม (เช่น DB ไม่มีข้อมูล, constraint) ให้บันทึกและรายงานผลตามจริง

