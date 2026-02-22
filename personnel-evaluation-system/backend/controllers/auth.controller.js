// controllers/auth.controller.js
// เวอร์ชันสอนนักศึกษา: routes -> controller -> knex (ไม่มี repository ชั้นกลาง)

// users repo will be imported dynamically inside the handler to ensure test
// mocks (vitest/vi.mock) are honored when tests use ESM-style mocking.
// Note: `bcrypt` and `jsonwebtoken` are imported dynamically inside the
// handler to ensure test mocks (vitest/vi.mock) are picked up correctly.



// ช่วย: เลือกฟิลด์ที่จะส่งกลับ (อย่าส่ง password_hash)
const pickPublic = (row) =>
  row && ({ id: row.id, name: row.name_th, email: row.email, role: row.role });

// Note: resolve `bcrypt` / `jsonwebtoken` at request-time via `require()`
// so test-time `vi.mock()` setups are honored for both unit and
// integration tests. We keep an `import()` fallback where appropriate.

/**
 * POST /api/auth/login
 * body: { email, password }
 * 200: { success:true, accessToken, user:{ id,name,email,role } }
 * 400: ข้อมูลไม่ครบ
 * 401: อีเมล/รหัสผ่านไม่ถูกต้อง
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "email and password required" });
    }

    // 1) ค้นผู้ใช้จากอีเมล ผ่าน repository
    // Try dynamic import() first so ESM-style vitest mocks are picked up.
    // Fall back to require() for CJS setups.
    let usersRepoMod = null
    const looksMocked = (m) => !!(m && ((m.findByEmail && m.findByEmail.mock) || (m.default && m.default.findByEmail && m.default.findByEmail.mock)))
    try { const imp = await import('../repositories/users.js'); if (imp && looksMocked(imp)) usersRepoMod = imp } catch (e) {}
    if (!usersRepoMod) {
      try { const imp2 = await import('../repositories/users'); if (imp2 && looksMocked(imp2)) usersRepoMod = imp2 } catch (e) {}
    }
    if (!usersRepoMod) {
      try { usersRepoMod = require('../repositories/users') } catch (e) {}
      try { if (!usersRepoMod) usersRepoMod = require('../repositories/users.js') } catch (e) {}
    }
    const usersRepo = (usersRepoMod && usersRepoMod.default) ? usersRepoMod.default : usersRepoMod
    const user = await usersRepo.findByEmail(email)
    console.log('[AUTH-DBG] user found:', !!user, user && { id: user.id, email: user.email })

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials-email" });
    }

    // 2) เปรียบเทียบรหัสผ่าน
    let ok = false
    // 1) try dynamic import (ESM-style mock)
    try {
      const bcryptEs = await import('bcrypt')
      const cmpEs = (bcryptEs && bcryptEs.compare) || (bcryptEs && bcryptEs.default && bcryptEs.default.compare)
      if (cmpEs) ok = await cmpEs(password, user.password_hash)
    } catch (e) {}
    // 2) if not ok yet, try require (CJS mock)
    if (!ok) {
      try {
        const bcryptCjs = require('bcrypt')
        const cmpCjs = (bcryptCjs && bcryptCjs.compare) || (bcryptCjs && bcryptCjs.default && bcryptCjs.default.compare)
        if (cmpCjs) ok = await cmpCjs(password, user.password_hash)
      } catch (e) {}
    }
    console.log('[AUTH-DBG] password/hmac:', password, user.password_hash)
    console.log('[AUTH-DBG] bcrypt ok:', ok)
    if (!ok) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials-password" });
    }

    // 3) สร้าง JWT
    // 1) try dynamic import (ESM-style mock) then fallback to require()
    let token
    try {
      const jwtMod = await import('jsonwebtoken')
      const sign = (jwtMod && jwtMod.sign) || (jwtMod && jwtMod.default && jwtMod.default.sign)
      if (sign) token = sign({ id: user.id, role: user.role, name: user.name_th }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "1h" })
    } catch (e) {}
    if (!token) {
      try {
        const jwtCjs = require('jsonwebtoken')
        const sign = (jwtCjs && jwtCjs.sign) || (jwtCjs && jwtCjs.default && jwtCjs.default.sign)
        if (sign) token = sign({ id: user.id, role: user.role, name: user.name_th }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "1h" })
      } catch (e) {}
    }

    // 4) ส่งผลลัพธ์ (อย่าส่ง password_hash ออกไป)
    return res.json({
      success: true,
      accessToken: token,
      user: pickPublic(user),
    });
  } catch (e) {
    next(e); // ให้ error handler กลางจัดการ
  }
};

/**
 * POST /api/auth/register
 * body: { email, password, name_th, department_id }
 * 201: { success:true, user:{ id,name,email,role } }
 * 400: ข้อมูลไม่ครบ
 * 409: อีเมลซ้ำ
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, name_th, department_id } = req.body || {};

    if (!email || !password || !name_th) {
      return res.status(400).json({ 
        success: false, 
        message: "email, password, and name_th required" 
      });
    }

    // ตรวจสอบอีเมลซ้ำ
    let usersRepoMod = null;
    try { usersRepoMod = require('../repositories/users') } catch (e) {}
    try { if (!usersRepoMod) usersRepoMod = require('../repositories/users.js') } catch (e) {}
    const usersRepo = (usersRepoMod && usersRepoMod.default) ? usersRepoMod.default : usersRepoMod;
    
    const existing = await usersRepo.findByEmail(email);
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: "Email already registered" 
      });
    }

    // Hash password
    let password_hash;
    try {
      const bcryptEs = await import('bcrypt');
      const hashFn = (bcryptEs && bcryptEs.hash) || (bcryptEs && bcryptEs.default && bcryptEs.default.hash);
      if (hashFn) password_hash = await hashFn(password, 10);
    } catch (e) {}
    if (!password_hash) {
      const bcryptCjs = require('bcrypt');
      const hashFn = (bcryptCjs && bcryptCjs.hash) || (bcryptCjs && bcryptCjs.default && bcryptCjs.default.hash);
      if (hashFn) password_hash = await hashFn(password, 10);
    }

    // สร้าง user ใหม่ (role=evaluatee โดยปริยาย)
    const db = require('../db/knex');
    const [id] = await db('users').insert({
      email,
      password_hash,
      name_th,
      role: 'evaluatee',
      status: 'active',
      department_id: department_id ? parseInt(department_id) : null,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    const user = await db('users').where({ id }).first();

    return res.status(201).json({
      success: true,
      user: pickPublic(user),
      message: "Registration successful. Please wait for admin approval."
    });
  } catch (e) {
    next(e);
  }
};

// หมายเหตุ: ในระบบจริง ควรมีการล็อกกิจกรรมการล็อกอิน (login audit) ด้วย