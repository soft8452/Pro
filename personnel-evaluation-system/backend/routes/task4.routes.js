// backend/routes/task4.routes.js
// Task 4: Unique Assignment
const router = require('express').Router();
const db = require('../db/knex');
const auth = require('../middlewares/auth');

/**
 * POST /task4/assignments
 * Body: { evaluator_id, evaluatee_id, period_id, dept_id }
 * ตรวจสอบความซ้ำซ้อน: (evaluator_id, evaluatee_id, period_id)
 */
router.post('/assignments', auth('admin'), async (req, res, next) => {
  try {
    const { evaluator_id, evaluatee_id, period_id, dept_id } = req.body;

    // Validate required fields
    if (!evaluator_id || !evaluatee_id || !period_id) {
      return res.status(400).json({ 
        error: 'evaluator_id, evaluatee_id, and period_id are required' 
      });
    }

    // ตรวจสอบว่ามี assignment ซ้ำหรือไม่
    const existing = await db('assignments')
      .where({
        evaluator_id: parseInt(evaluator_id),
        evaluatee_id: parseInt(evaluatee_id),
        period_id: parseInt(period_id)
      })
      .first();

    if (existing) {
      return res.status(409).json({ 
        error: 'DUPLICATE_ASSIGNMENT',
        message: 'This assignment already exists'
      });
    }

    // สร้าง assignment ใหม่
    const [id] = await db('assignments').insert({
      evaluator_id: parseInt(evaluator_id),
      evaluatee_id: parseInt(evaluatee_id),
      period_id: parseInt(period_id),
      dept_id: dept_id ? parseInt(dept_id) : null,
      created_at: db.fn.now()
    });

    // ดึงข้อมูลที่สร้างใหม่
    const assignment = await db('assignments')
      .where({ id })
      .first();

    return res.status(201).json({
      success: true,
      data: assignment
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
