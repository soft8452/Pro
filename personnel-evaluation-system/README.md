# ระบบประเมินสมรรถนะบุคลากรอาชีวศึกษา (Vocational Personnel Competency Evaluation System)

## 📋 ภาพรวมโปรเจค (Project Overview)

ระบบประเมินสมรรถนะบุคลากรสำหรับวิทยาลัยอาชีวศึกษา ประกอบด้วย:
- **Frontend**: Nuxt 3 + Vuetify 3 + Pinia + Axios
- **Backend**: Express.js + Knex.js + MySQL
- **Database**: MySQL 8.x
- **Authentication**: JWT (JSON Web Token)

### โครงสร้างโฟลเดอร์หลัก
```
competency2568/
├── backend/           # Express API Server (Port 7000)
├── frontend/          # Nuxt 3 Application (Port 3000)
├── schema.sql         # Database schema + seed data
├── docker-compose.yml # Docker configuration
├── .env               # Root environment variables
└── README.md          # เอกสารนี้
```

---

## 🛠 System Requirements

### ขั้นต่ำ (Minimum)
- **Node.js**: v18.x หรือสูงกว่า (แนะนำ v20.x)
- **npm**: v9.x หรือสูงกว่า
- **MySQL**: v8.0 หรือสูงกว่า (หรือ XAMPP/Docker)
- **Git**: สำหรับ clone repository

### ทางเลือก (Optional)
- **Docker + Docker Compose**: สำหรับรัน database และ services ผ่าน container
- **XAMPP**: สำหรับ MySQL server และ phpMyAdmin

---

## 🚀 ขั้นตอนการติดตั้งและรันโปรเจค (Step-by-Step Setup)

### วิธีที่ 1: ใช้ XAMPP (แนะนำสำหรับ Windows)

#### ขั้นตอนที่ 1: เตรียม MySQL Database

1. **เปิด XAMPP Control Panel** และ start **MySQL** service

2. **สร้าง Database** โดยเข้า phpMyAdmin (http://localhost/phpmyadmin) แล้วรัน SQL:
   ```sql
   CREATE DATABASE skills_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Import Schema และ Seed Data**:
   - เลือก database `skills_db` ใน phpMyAdmin
   - ไปที่ tab "Import"
   - เลือกไฟล์ `schema.sql` จากโฟลเดอร์โปรเจค
   - คลิก "Import"

   หรือใช้ command line:
   ```bash
   mysql -u root < schema.sql
   ```

#### ขั้นตอนที่ 2: ติดตั้ง Dependencies

```bash
# ติดตั้ง Backend dependencies
cd backend
npm install

# ติดตั้ง Frontend dependencies
cd ../frontend
npm install
```

#### ขั้นตอนที่ 3: ตั้งค่า Environment Variables

**Backend** (`backend/.env`):
```env
# Server
PORT=7000
CORS_ORIGIN=http://localhost:3000

# Database (XAMPP default)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=skills_db

# Security
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES=2h
```

**หมายเหตุ**: ถ้าใช้ XAMPP ค่า `DB_PASSWORD` มักจะว่างเปล่า

#### ขั้นตอนที่ 4: รัน Servers

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```
Backend จะรันที่: http://localhost:7000

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```
Frontend จะรันที่: http://localhost:3000

---

### วิธีที่ 2: ใช้ Docker (แนะนำสำหรับ Development Environment)

```bash
# รัน services ทั้งหมด (MySQL + Backend + Frontend)
docker-compose up -d

# หรือรันเฉพาะ MySQL
docker-compose up -d db phpmyadmin
```

**Services ที่จะถูกสร้าง**:
| Service    | Port | Description |
|------------|------|-------------|
| db         | 3306 | MySQL 8.0 |
| phpmyadmin | 8080 | Database management |
| api        | 7000 | Backend API |
| frontend   | 3000 | Nuxt application |

**Docker Environment Variables**:
- MySQL Root Password: `rootpassword`
- MySQL Database: `skills_db`
- MySQL User: `user1` / Password: `user1_1234`

---

## 🔑 บัญชีผู้ใช้งานทดสอบ (Demo Users)

### Admin (ผู้ดูแลระบบ)
| Email | Password | Role |
|-------|----------|------|
| admin@ccollege.ac.th | admin123 | admin |

### Evaluator (กรรมการประเมิน)
| Email | Password | Role | แผนก |
|-------|----------|------|------|
| eva.me@ccollege.ac.th | password123 | evaluator | เครื่องกล |
| eva.it@ccollege.ac.th | password123 | evaluator | IT |

### Evaluatee (ผู้ถูกประเมิน)
| Email | Password | Role | แผนก |
|-------|----------|------|------|
| t.it01@ccollege.ac.th | demo123 | evaluatee | IT |
| t.me01@ccollege.ac.th | demo123 | evaluatee | เครื่องกล |
| t.acc01@ccollege.ac.th | demo123 | evaluatee | การบัญชี |

---

## 🌐 URLs และ Endpoints

### Frontend URLs
| URL | Description |
|-----|-------------|
| http://localhost:3000 | หน้าแรก |
| http://localhost:3000/login | หน้า Login |
| http://localhost:3000/me | หน้า Dashboard ผู้ใช้ |

### Backend API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /docs | Swagger API Documentation |
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/auth/me | Current user info |
| GET/POST/PUT/DELETE | /api/users | User CRUD |
| GET/POST/PUT/DELETE | /api/topics | Evaluation topics CRUD |
| GET/POST/PUT/DELETE | /api/indicators | Indicators CRUD |
| GET/POST/PUT/DELETE | /api/periods | Evaluation periods CRUD |
| GET/POST/PUT/DELETE | /api/departments | Departments CRUD |
| GET/POST/PUT/DELETE | /api/assignments | Evaluation assignments CRUD |
| GET/POST | /api/results | Evaluation results |
| GET | /api/periods/active | Active period |
| GET | /api/evidence-types | Evidence types list |
| GET/POST/DELETE | /api/attachments | Attachments management |
| POST | /api/upload | File upload |

### Task-specific Routes (Business Logic)
| Route | Description |
|-------|-------------|
| /api/task1 | IDOR Guard - Evaluation results access control |
| /api/task2 | Evidence submission rules |
| /api/task3 | Normalized scoring (/60) |
| /api/task4 | Unique assignment validation |
| /api/task5 | Progress by department |

---

## 🗄 Database Schema Overview

### หลักๆ Tables
| Table | Description |
|-------|-------------|
| users | ผู้ใช้งาน (admin, evaluator, evaluatee) |
| evaluation_periods | รอบการประเมิน |
| evaluation_topics | หัวข้อการประเมิน |
| indicators | ตัวชี้วัด |
| evidence_types | ประเภทหลักฐาน |
| indicator_evidence | ความสัมพันธ์ตัวชี้วัด-หลักฐาน |
| assignments | มอบหมายการประเมิน (evaluator → evaluatee) |
| evaluation_results | ผลการประเมิน |
| attachments | ไฟล์แนบหลักฐาน |
| departments | แผนกวิชา |
| org_groups | ฝ่ายงาน |
| vocational_categories | ประเภทวิชา |
| vocational_fields | สาขาวิชา |

### Entity Relationships
```
users ──< assignments >── users
         ↑
         ├── evaluation_periods
         └── evaluation_results ──< indicators ──< evaluation_topics
                                        ↓
                                   indicator_evidence ──< evidence_types
                                        ↓
                                   attachments
```

---

## 🔐 Authentication Flow

### Login Process
1. POST `/api/auth/login` with `{ email, password }`
2. Backend validates credentials using bcrypt
3. Returns JWT token if valid
4. Frontend stores token in localStorage as `auth_token`
5. All subsequent requests include `Authorization: Bearer <token>`

### Token Details
- **Algorithm**: HS256
- **Expiration**: 2 hours (configurable via `JWT_EXPIRES`)
- **Payload**: `{ id, email, role, name_th, department_id }`

### Auth Middleware Usage (Backend)
```javascript
// auth middleware เป็น higher-order function ต้องเรียกด้วย ()
const auth = require('./middlewares/auth');

// ✅ ถูกต้อง
router.get('/protected', auth(), (req, res) => { ... });

// ❌ ผิด - จะ error
router.get('/protected', auth, (req, res) => { ... });
```

---

## 🧪 การทดสอบ (Testing)

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Test Files Location
- Backend: `backend/test/`
- Frontend: `frontend/tests/`

---

## 📁 File Upload

### Storage Path
- Uploads จะถูกเก็บที่: `backend/uploads/{evaluatee_id}/{period_id}/`
- Static files: `backend/public/`

### Supported Formats
- Images: jpg, jpeg, png, gif
- Documents: pdf, doc, docx

### Upload Endpoint
```
POST /api/upload
Content-Type: multipart/form-data

Form fields:
- file: Binary file
- indicator_id: ID ของตัวชี้วัด
- evidence_type_id: ID ของประเภทหลักฐาน
```

---

## 🛠 Scripts ที่มีประโยชน์

### สร้าง Password Hash ใหม่
```bash
cd backend
node -e "const bcrypt=require('bcrypt');bcrypt.hash('YOUR_PASSWORD',10,(e,h)=>{console.log(h);});"
```

### ตรวจสอบ Password Hash
```bash
cd backend
node scripts/check_hash.js
```

### Apply Schema (ถ้ามี)
```bash
cd backend
node scripts/apply_schema.js
```

### Seed Test Data
```bash
cd backend
node scripts/seed_testdata.js
```

---

## ⚠️ Troubleshooting

### Error: CORS blocked
- ตรวจสอบว่า `CORS_ORIGIN` ใน backend/.env ตั้งค่าถูกต้อง
- ค่าควรเป็น: `CORS_ORIGIN=http://localhost:3000`

### Error: Connection refused to MySQL
- ตรวจสอบว่า MySQL service รันอยู่
- ตรวจสอบค่า `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` ใน .env

### Error: auth is not a function
- Auth middleware ต้องเรียกด้วย `auth()` ไม่ใช่ `auth`

### Error: 500 Internal Server Error on PUT/POST
- ตรวจสอบว่าไม่มีการใช้คอลัมน์ที่ไม่มีใน database schema
- บางคอลัมน์เช่น `updated_at` มีเฉพาะบาง tables

### Frontend ไม่แสดงข้อมูล
- ตรวจสอบ Console เพื่อดู Network errors
- ตรวจสอบว่า Backend รันอยู่ที่ port 7000
- ตรวจสอบ JWT token ยังไม่หมดอายุ

---

## 📊 Role Permissions (สิทธิ์การใช้งาน)

| Feature | Admin | Evaluator | Evaluatee |
|---------|-------|-----------|-----------|
| จัดการผู้ใช้ | ✅ | ❌ | ❌ |
| จัดการรอบประเมิน | ✅ | ❌ | ❌ |
| จัดการหัวข้อ/ตัวชี้วัด | ✅ | ❌ | ❌ |
| มอบหมายการประเมิน | ✅ | ❌ | ❌ |
| ดูรายงานทั้งหมด | ✅ | ❌ | ❌ |
| ประเมินผู้ถูกประเมิน | ❌ | ✅ | ❌ |
| ดูผลประเมินที่รับผิดชอบ | ❌ | ✅ | ❌ |
| อัพโหลดหลักฐาน | ❌ | ❌ | ✅ |
| ดูผลประเมินตนเอง | ❌ | ❌ | ✅ |
| ประเมินตนเอง (Self-score) | ❌ | ❌ | ✅ |

---

## 🔄 Quick Start Summary

```bash
# 1. Clone และเข้าโฟลเดอร์โปรเจค
cd competency2568

# 2. Import database (สำหรับ XAMPP)
# ใน phpMyAdmin: Import -> เลือก schema.sql

# 3. ติดตั้ง dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. รัน Backend (Terminal 1)
cd backend && npm run dev

# 5. รัน Frontend (Terminal 2)
cd frontend && npm run dev

# 6. เปิดเว็บไซต์
# http://localhost:3000

# 7. Login ด้วย
# Email: admin@ccollege.ac.th
# Password: admin123
```

---

## 📝 Version Information

| Package | Backend | Frontend |
|---------|---------|----------|
| Runtime | Node.js | Node.js |
| Framework | Express 4.19.2 | Nuxt 3.19.2 |
| Database | Knex 3.1.0 + MySQL2 3.9.7 | - |
| UI | - | Vuetify 3.7.3 |
| State | - | Pinia 3.0.3 |
| HTTP Client | - | Axios 1.12.2 |
| Auth | bcrypt 5.1.1 + JWT 9.0.2 | - |

---

## 📄 License

ระบบนี้พัฒนาเพื่อการเรียนการสอนและการแข่งขันทักษะอาชีวศึกษา
