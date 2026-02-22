# 🚀 Database Setup - Manual Instructions

## ⚠️ ปัญหาปัจจุบัน
- Windows ต้อง Admin privileges ในการติดตั้ง package managers
- MySQL/MariaDB ต้อง GUI installer หรือ Admin access
- Docker Desktop ต้องติดตั้งแยกต่างหาก

---

## ✅ แนวทางแก้ไข - เลือก 1 วิธี

### **วิธีที่ 1: XAMPP (แนะนำ - ง่ายสุด)**

#### ขั้นตอน:
1. **ดาวน์โหลด XAMPP**
   - ไปที่ https://www.apachefriends.org
   - ดาวน์โหลด XAMPP for Windows (Include Apache, MySQL, PHP, Perl)
   - เลือก version ล่าสุด (v8.x+)

2. **ติดตั้ง XAMPP**
   - รัน installer
   - เลือก components: อย่างน้อยต้องเลือก **MySQL**
   - เลือกติดตั้งใน `C:\xampp`

3. **เปิด XAMPP Control Panel**
   - Start **MySQL**
   - รอจนกว่าจะเห็น "Running on port 3306"

4. **สร้าง Database**
   - เปิด phpMyAdmin: http://localhost/phpmyadmin
   - คลิก "New"
   - Database name: `skills_db`
   - Collation: `utf8mb4_unicode_ci`
   - คลิก "Create"

5. **Import Schema**
   - เลือก database `skills_db`
   - คลิก tab "Import"
   - คลิก "Choose File" และเลือก `schema.sql` จากโปรเจค
   - คลิก "Import"

6. **ทดสอบ Backend**
   ```bash
   cd backend
   npm run dev
   ```
   - ควรเห็น: `API running on http://localhost:7000`

---

### **วิธีที่ 2: Docker Desktop (Advanced)**

#### ขั้นตอน:
1. **ดาวน์โหลด Docker Desktop**
   - ไปที่ https://www.docker.com/products/docker-desktop
   - ดาวน์โหลด Docker Desktop for Windows

2. **ติดตั้ง Docker Desktop**
   - รัน installer
   - ติดตั้งให้เสร็จสมบูรณ์
   - Restart Windows
   - เปิด Docker Desktop (รอให้ engine เพิ่มขึ้น)

3. **รัน docker-compose**
   ```bash
   cd C:\systemdevelop1\personnel-evaluation-system
   docker-compose up -d
   ```

4. **แปรง Environment ใน backend/.env**
   ```env
   DB_HOST=db
   DB_USER=user1
   DB_PASSWORD=user1_1234
   ```

5. **ทดสอบ Backend**
   ```bash
   cd backend
   npm run dev
   ```

---

### **วิธีที่ 3: WSL2 + Ubuntu (Advanced)**

#### ขั้นตอน:
1. **ติดตั้ง WSL2**
   ```powershell
   wsl --install
   ```
   - Restart Windows

2. **เปิด Ubuntu Terminal**
   - ติดตั้ง MySQL:
   ```bash
   sudo apt update
   sudo apt install mysql-server mysql-client
   sudo service mysql start
   ```

3. **สร้าง Database**
   ```bash
   mysql -u root -e "CREATE DATABASE skills_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root < schema.sql
   ```

4. **ตั้งค่า Backend .env**
   ```env
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=skills_db
   ```

---

## 📋 การตรวจสอบใหม่ (Verification)

หลังจากติดตั้ง Database แล้ว ให้รัน script:

```bash
cd C:\systemdevelop1\personnel-evaluation-system\backend
node scripts/apply_schema.js
```

- ถ้าสำเร็จ: `Schema applied successfully`
- ถ้าล้มเหลว: ตรวจสอบ `.env` และ MySQL status

---

## 🔐 Demo User Credentials (หลังสำเร็จ)

**Admin Account:**
- Email: `admin@ccollege.ac.th`
- Password: `admin123`

**Evaluator Account:**
- Email: `eva.it@ccollege.ac.th`  
- Password: `password123`

**Teacher Account:**
- Email: `t.it01@ccollege.ac.th`
- Password: `demo123`

---

## 🌐 Access Applications

เมื่อ Database พร้อมใช้งาน:

| Application | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:7000 |
| API Docs (Swagger) | http://localhost:7000/api-docs |
| phpMyAdmin (XAMPP only) | http://localhost/phpmyadmin |

---

## ❓ Troubleshooting

### Backend error: "connect ECONNREFUSED"
- ✅ ตรวจสอบว่า MySQL service กำลังทำงาน
- ✅ ตรวจสอบค่า DB_HOST, DB_USER, DB_PASSWORD ใน `.env`

### phpMyAdmin error: "Cannot connect to MySQL"
- ✅ เปิด XAMPP Control Panel แล้ว Start MySQL

### Port 3000 หรือ 7000 ถูก occupy
```bash
# Powershell - หาว่า process ใช้ port ไหน
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object OwningProcess
# ทำให้ process ที่มี PID ใหญ่: Stop-Process -Id <PID> -Force
```

---

**Last Updated**: 2026-02-22 09:00 AM
