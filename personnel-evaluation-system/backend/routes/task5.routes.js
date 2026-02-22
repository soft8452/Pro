// backend/routes/task5.routes.js
// Task 5: Progress by Department
const router = require('express').Router();
const db = require('../db/knex');
const auth = require('../middlewares/auth');

/**
 * GET /task5/reports/progress?period_id=1
 * คืน: [{ department, submitted, total, percent }]
 * % = submitted/total * 100 (ปัด 2 ตำแหน่ง; total=0 → 0)
 */
router.get('/reports/progress', auth('admin', 'evaluator'), async (req, res, next) => {
  try {
    const { period_id } = req.query;

    if (!period_id) {
      return res.status(400).json({ error: 'period_id required' });
    }

    // ดึงข้อมูลความคืบหน้าแบ่งตามแผนก
    const progress = await db('assignments as a')
      .where({ 'a.period_id': parseInt(period_id) })
      .leftJoin('departments as d', 'a.dept_id', 'd.id')
      .leftJoin('evaluation_results as er', function() {
        this.on('er.period_id', '=', 'a.period_id')
            .andOn('er.evaluatee_id', '=', 'a.evaluatee_id')
            .andOn('er.evaluator_id', '=', 'a.evaluator_id');
      })
      .select(
        'd.name_th as department',
        'd.id as dept_id',
        db.raw('COUNT(DISTINCT a.id) as total'),
        db.raw("COUNT(DISTINCT CASE WHEN er.status = 'submitted' THEN a.id END) as submitted")
      )
      .groupBy('d.id', 'd.name_th');

    // คำนวณ %
    const result = progress.map(p => {
      const total = parseInt(p.total) || 0;
      const submitted = parseInt(p.submitted) || 0;
      const percent = total === 0 ? 0 : Math.round((submitted / total) * 10000) / 100;

      return {
        department: p.department || 'ไม่ระบุแผนก',
        dept_id: p.dept_id,
        submitted,
        total,
        percent
      };
    });

    return res.status(200).json({
      period_id: parseInt(period_id),
      progress: result
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
