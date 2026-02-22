// backend/routes/task1.routes.js
// Task 1: IDOR Guard - GET /task1/evaluation-results
const router = require('express').Router();
const db = require('../db/knex');
const auth = require('../middlewares/auth');

/**
 * GET /task1/evaluation-results?user_id=...&assignment_id=...&period_id=...
 * IDOR Guard: ตรวจสิทธิ์การเข้าถึงข้อมูล
 * - admin: ดูได้ทุก assignment หรือดูทั้งหมดถ้าไม่ส่ง assignment_id
 * - evaluator: ดูได้เฉพาะ assignment ที่ตัวเองเป็นผู้ประเมิน หรือดูทั้งหมดของตัวเองถ้าไม่ส่ง assignment_id
 * - evaluatee: ดูได้เฉพาะผลการประเมินของตนเอง
 */
router.get('/evaluation-results', auth('admin', 'evaluator', 'evaluatee'), async (req, res, next) => {
  try {
    const { user_id, assignment_id, period_id } = req.query;
    const { id: currentUserId, role } = req.user;

    // For evaluatees viewing their own results - assignment_id is optional
    if (role === 'evaluatee') {
      // Get results for this evaluatee
      let query = db('evaluation_results')
        .where({ evaluatee_id: currentUserId })
        .leftJoin('indicators', 'evaluation_results.indicator_id', 'indicators.id')
        .leftJoin('evaluation_topics', 'evaluation_results.topic_id', 'evaluation_topics.id')
        .select(
          'evaluation_results.*',
          'indicators.name_th as indicator_name',
          'indicators.type as indicator_type',
          'evaluation_topics.title_th as topic_title'
        );

      // Optional period filter
      if (period_id) {
        query = query.where('evaluation_results.period_id', period_id);
      }

      const results = await query;

      return res.status(200).json({
        evaluatee_id: currentUserId,
        period_id: period_id ? parseInt(period_id) : null,
        results
      });
    }

    // For evaluators without assignment_id - return all their evaluations
    if (role === 'evaluator' && !assignment_id) {
      let query = db('evaluation_results')
        .where({ evaluator_id: currentUserId })
        .leftJoin('indicators', 'evaluation_results.indicator_id', 'indicators.id')
        .leftJoin('evaluation_topics', 'evaluation_results.topic_id', 'evaluation_topics.id')
        .leftJoin('users as evaluatee', 'evaluation_results.evaluatee_id', 'evaluatee.id')
        .select(
          'evaluation_results.*',
          'indicators.name_th as indicator_name',
          'indicators.type as indicator_type',
          'evaluation_topics.title_th as topic_title',
          'evaluatee.name_th as evaluatee_name'
        );

      if (period_id) {
        query = query.where('evaluation_results.period_id', period_id);
      }

      const results = await query;

      return res.status(200).json({
        evaluator_id: currentUserId,
        period_id: period_id ? parseInt(period_id) : null,
        results
      });
    }

    // For admin without assignment_id - return empty or all results
    if (role === 'admin' && !assignment_id) {
      let query = db('evaluation_results')
        .leftJoin('indicators', 'evaluation_results.indicator_id', 'indicators.id')
        .leftJoin('evaluation_topics', 'evaluation_results.topic_id', 'evaluation_topics.id')
        .leftJoin('users as evaluatee', 'evaluation_results.evaluatee_id', 'evaluatee.id')
        .leftJoin('users as evaluator', 'evaluation_results.evaluator_id', 'evaluator.id')
        .select(
          'evaluation_results.*',
          'indicators.name_th as indicator_name',
          'indicators.type as indicator_type',
          'evaluation_topics.title_th as topic_title',
          'evaluatee.name_th as evaluatee_name',
          'evaluator.name_th as evaluator_name'
        );

      if (period_id) {
        query = query.where('evaluation_results.period_id', period_id);
      }

      const results = await query;

      return res.status(200).json({
        period_id: period_id ? parseInt(period_id) : null,
        results
      });
    }

    // With assignment_id - specific assignment lookup
    // ดึงข้อมูล assignment
    const assignment = await db('assignments')
      .where({ id: assignment_id })
      .first();

    if (!assignment) {
      return res.status(404).json({ error: 'assignment not found' });
    }

    // ตรวจสอบสิทธิ์ตามบทบาท
    if (role === 'evaluator') {
      // evaluator ดูได้เฉพาะที่ตัวเองเป็นผู้ประเมิน
      if (assignment.evaluator_id !== currentUserId) {
        return res.status(403).json({ error: 'forbidden' });
      }
    }
    // admin ดูได้ทุกอัน (ไม่ต้องเช็คเพิ่ม)

    // ดึงผลการประเมิน
    const results = await db('evaluation_results')
      .where({ 
        period_id: assignment.period_id,
        evaluatee_id: assignment.evaluatee_id,
        evaluator_id: assignment.evaluator_id
      })
      .leftJoin('indicators', 'evaluation_results.indicator_id', 'indicators.id')
      .leftJoin('evaluation_topics', 'evaluation_results.topic_id', 'evaluation_topics.id')
      .select(
        'evaluation_results.*',
        'indicators.name_th as indicator_name',
        'indicators.type as indicator_type',
        'evaluation_topics.title_th as topic_title'
      );

    return res.status(200).json({
      assignment_id: parseInt(assignment_id),
      period_id: assignment.period_id,
      evaluator_id: assignment.evaluator_id,
      evaluatee_id: assignment.evaluatee_id,
      results
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
