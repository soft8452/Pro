-- อัปเดตรหัสผ่านสำหรับ user demo
-- ให้รันไฟล์นี้ใน phpMyAdmin หรือ MySQL client

USE skills_db;

-- อัปเดตรหัสผ่านเป็น 'admin123' สำหรับ admin
UPDATE users 
SET password_hash = '$2b$10$B1Cbu6x8X1RQzXbRk9L1HuHzjlW38F5m/XfYlhZktdfrVaB2rmhBu'
WHERE email = 'admin@ccollege.ac.th';

-- อัปเดตรหัสผ่านเป็น 'password123' สำหรับ evaluator ทั้งหมด
UPDATE users 
SET password_hash = '$2b$10$oIlhkntQao7fWcA5ZtcFX.iiu27KdiG3F7cIAqQJ9jGMIGV0GjKcO'
WHERE role = 'evaluator';

-- อัปเดตรหัสผ่านเป็น 'demo123' สำหรับ evaluatee ทั้งหมด
UPDATE users 
SET password_hash = '$2b$10$FPkdvU5UyXz9dfVBO1GZ4uT2bUw3Dy56H2f4fxOA6s///N0cnzz2S'
WHERE role = 'evaluatee';

-- ตรวจสอบผลลัพธ์
SELECT id, email, name_th, role, status 
FROM users 
ORDER BY role, email;
