# ⚡ Quick Start Guide

> **สถานะปัจจุบัน**: Backend และ Frontend server ทำงานแล้ว - ต้องติดตั้ง Database เท่านั้น!

---

## 🎯 ใน 5 นาที ให้เริ่มทำงาน

### **OPTION A: ใช้ XAMPP (Windows Users)**

1. **ดาวน์โหลด XAMPP**
   ```
   https://www.apachefriends.org/download.html
   → เลือก Windows version ล่าสุด
   → Run installer
   ```

2. **เปิด XAMPP แล้ว Start MySQL**
   ```
   XAMPP Control Panel → MySQL [Start]
   ```

3. **Import Database**
   ```
   เปิด http://localhost/phpmyadmin
   → คลิก Import
   → เลือก schema.sql
   → คลิก Import
   ```

4. **ทดสอบ**
   ```bash
   cd backend
   npm run dev
   # ถ้าเห็น "API running on http://localhost:7000" = สำเร็จ!
   ```

### **OPTION B: ใช้ Docker (ทุก OS)**

```powershell
# ในโปรเจค folder
docker-compose up -d

# แปรง DB_HOST ใน backend/.env
$content = Get-Content backend/.env
$content = $content -replace 'DB_HOST=127\.0\.0\.1', 'DB_HOST=db'
$content | Set-Content backend/.env

# Restart backend
cd backend
npm run dev
```

---

## 🌐 เข้าใช้งาน

| เทพ | URL | Username | Password |
|---|---|---|---|
| **Frontend** | http://localhost:3000 | admin@ccollege.ac.th | admin123 |
| **Backend API** | http://localhost:7000 | - | - |
| **API Docs** | http://localhost:7000/api-docs | - | - |
| **phpMyAdmin** | http://localhost/phpmyadmin | root | (ว่างเปล่า) |

---

## 📝 Files Reference

| File | Purpose |
|---|---|
| [DATABASE_SETUP.md](DATABASE_SETUP.md) | ขั้นตอนการติดตั้ง Database แบบละเอียด |
| [DEMO_USERS.md](DEMO_USERS.md) | บัญชี User สำหรับทดสอบ |
| [backend/.env](backend/.env) | ตั้งค่า Database, JWT, CORS |
| [frontend/.env.example](frontend/.env.example) | ตั้งค่า API endpoint (optional) |
| [schema.sql](schema.sql) | Database schema + seed data |

---

## 🚨 ถ้ามีปัญหา

```bash
# ตรวจสอบ Node version
node --version     # ต้อง v18+

# ตรวจสอบ Backend connection
cd backend
node scripts/apply_schema.js
# ถ้าเห็น "Schema applied successfully" = DB ok!

# ตรวจสอบ Port
# Port 3000 (Frontend), 7000 (Backend), 3306 (MySQL)
netstat -ano | findstr :3000
netstat -ano | findstr :7000
netstat -ano | findstr :3306
```

---

**Next Step**: [DATABASE_SETUP.md](DATABASE_SETUP.md) - เลือกวิธีติดตั้ง Database

