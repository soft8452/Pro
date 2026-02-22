// backend/routes/task3.routes.js
// Task 3: Normalized /60
const router = require('express').Router();
const db = require('../db/knex');
const auth = require('../middlewares/auth');

/**
 * GET /task3/reports/normalized?period_id=1
 * สูตร Normalized:
 * - score_1_4: r = (score - 1) / 3
 * - yes_no: 0 หรือ 1
 */
router.get('/reports/normalized', auth('admin', 'evaluator', 'evaluatee'), async (req, res, next) => {
  try {
    const { period_id } = req.query;

    if (!period_id) {
      return res.status(400).json({ error: 'period_id required' });
    }

    // ดึงข้อมูลผลการประเมิน
    const results = await db('evaluation_results as er')
      .where({ 'er.period_id': parseInt(period_id) })
      .join('indicators as i', 'er.indicator_id', 'i.id')
      .join('evaluation_topics as t', 'er.topic_id', 't.id')
      .join('users as u', 'er.evaluatee_id', 'u.id')
      .select(
        'er.*',
        'i.type as indicator_type',
        'i.weight as indicator_weight',
        't.title_th as topic_title',
        't.weight as topic_weight',
        't.code as topic_code',
        'u.name_th as evaluatee_name',
        'u.email as evaluatee_email'
      );

    // คำนวณคะแนน normalized
    const normalized = results.map(r => {
      let normalizedScore = 0;
      
      if (r.indicator_type === 'score_1_4' && r.score !== null) {
        // r = (score - 1) / 3
        normalizedScore = (r.score - 1) / 3;
      } else if (r.indicator_type === 'yes_no' && r.value_yes_no !== null) {
        // 0 หรือ 1
        normalizedScore = r.value_yes_no;
      }

      return {
        ...r,
        normalized_score: Math.round(normalizedScore * 100) / 100 // ปัด 2 ตำแหน่ง
      };
    });

    // จัดกลุ่มตาม evaluatee และ topic
    const grouped = {};
    
    normalized.forEach(r => {
      const key = `${r.evaluatee_id}_${r.topic_code}`;
      if (!grouped[key]) {
        grouped[key] = {
          evaluatee_id: r.evaluatee_id,
          evaluatee_name: r.evaluatee_name,
          evaluatee_email: r.evaluatee_email,
          topic_code: r.topic_code,
          topic_title: r.topic_title,
          topic_weight: parseFloat(r.topic_weight),
          indicators: [],
          total_normalized: 0
        };
      }
      grouped[key].indicators.push({
        indicator_id: r.indicator_id,
        type: r.indicator_type,
        score: r.score,
        value_yes_no: r.value_yes_no,
        normalized_score: r.normalized_score,
        weight: parseFloat(r.indicator_weight)
      });
      grouped[key].total_normalized += r.normalized_score;
    });

    // คำนวณคะแนนรวม /60
    const summary = {};
    Object.values(grouped).forEach(group => {
      if (!summary[group.evaluatee_id]) {
        summary[group.evaluatee_id] = {
          evaluatee_id: group.evaluatee_id,
          evaluatee_name: group.evaluatee_name,
          evaluatee_email: group.evaluatee_email,
          topics: {},
          total_score: 0
        };
      }
      
      // คะแนนของหัวข้อนี้ = avg(normalized) * weight * 60
      const avgNormalized = group.total_normalized / group.indicators.length;
      const topicScore = avgNormalized * group.topic_weight * 60;
      
      summary[group.evaluatee_id].topics[group.topic_code] = {
        title: group.topic_title,
        weight: group.topic_weight,
        avg_normalized: Math.round(avgNormalized * 100) / 100,
        score: Math.round(topicScore * 100) / 100
      };
      
      summary[group.evaluatee_id].total_score += topicScore;
    });

    // ปัดคะแนนรวม
    Object.values(summary).forEach(s => {
      s.total_score = Math.round(s.total_score * 100) / 100;
    });

    return res.status(200).json({
      period_id: parseInt(period_id),
      summary: Object.values(summary)
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
