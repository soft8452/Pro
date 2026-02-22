// routes/results.routes.js
const router = require('express').Router();
const db = require('../db/knex');
const auth = require('../middlewares/auth');

// GET /api/results - List evaluation results with filters
router.get('/', auth(), async (req, res) => {
  try {
    const { period_id, indicator_id, evaluatee_id, evaluator_id, status } = req.query;
    
    let query = db('evaluation_results as r')
      .leftJoin('indicators as i', 'r.indicator_id', 'i.id')
      .leftJoin('evaluation_topics as t', 'r.topic_id', 't.id')
      .leftJoin('users as evaluatee', 'r.evaluatee_id', 'evaluatee.id')
      .leftJoin('users as evaluator', 'r.evaluator_id', 'evaluator.id')
      .leftJoin('departments as d', 'evaluatee.dept_id', 'd.id')
      .select(
        'r.*',
        'i.name_th as indicator_name',
        'i.code as indicator_code',
        'i.type as indicator_type',
        't.title_th as topic_title',
        'evaluatee.name_th as evaluatee_name',
        'evaluator.name_th as evaluator_name',
        'd.name_th as dept_name'
      )
      .orderBy('r.id', 'desc');

    // Apply filters
    if (period_id) query = query.where('r.period_id', period_id);
    if (indicator_id) query = query.where('r.indicator_id', indicator_id);
    if (evaluatee_id) query = query.where('r.evaluatee_id', evaluatee_id);
    if (evaluator_id) query = query.where('r.evaluator_id', evaluator_id);
    if (status) query = query.where('r.status', status);

    // Role-based filtering
    if (req.user.role === 'evaluator') {
      query = query.where('r.evaluator_id', req.user.id);
    } else if (req.user.role === 'evaluatee') {
      query = query.where('r.evaluatee_id', req.user.id);
    }

    const results = await query;
    res.json({ data: results });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// GET /api/results/:id - Get result by ID
router.get('/:id', auth(), async (req, res) => {
  try {
    const result = await db('evaluation_results as r')
      .leftJoin('indicators as i', 'r.indicator_id', 'i.id')
      .leftJoin('evaluation_topics as t', 'r.topic_id', 't.id')
      .where('r.id', req.params.id)
      .select('r.*', 'i.name_th as indicator_name', 'i.type as indicator_type', 't.title_th as topic_title')
      .first();
    
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Check access rights using evaluator_id/evaluatee_id from result
    if (req.user.role === 'evaluator' && result.evaluator_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role === 'evaluatee' && result.evaluatee_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.json(result);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

// POST /api/results - Create new result (evaluator only)
router.post('/', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'evaluator' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { period_id, evaluatee_id, topic_id, indicator_id, score, value_yes_no, notes } = req.body;

    // Get evaluator_id from current user (or from body for admin)
    const evaluator_id = req.user.role === 'admin' ? (req.body.evaluator_id || req.user.id) : req.user.id;

    // Verify assignment exists for evaluator
    if (req.user.role === 'evaluator') {
      const assignment = await db('assignments')
        .where({ 
          period_id, 
          evaluator_id: req.user.id, 
          evaluatee_id 
        })
        .first();
      if (!assignment) {
        return res.status(403).json({ error: 'No assignment found for this evaluatee' });
      }
    }

    const [id] = await db('evaluation_results').insert({
      period_id,
      evaluatee_id,
      evaluator_id,
      topic_id,
      indicator_id,
      score,
      value_yes_no,
      notes,
      status: 'draft'
    });

    const newResult = await db('evaluation_results').where('id', id).first();
    res.status(201).json(newResult);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to create result' });
  }
});

// PUT /api/results/:id - Update result (evaluator only)
router.put('/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'evaluator' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { score, value_yes_no, notes, status } = req.body;

    // Verify ownership
    const result = await db('evaluation_results').where('id', req.params.id).first();
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    if (req.user.role === 'evaluator' && result.evaluator_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db('evaluation_results')
      .where('id', req.params.id)
      .update({
        score,
        value_yes_no,
        notes,
        status
      });

    const updated = await db('evaluation_results').where('id', req.params.id).first();
    res.json(updated);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to update result' });
  }
});

// PATCH /api/results/:id/submit - Submit result (evaluator only)
router.patch('/:id/submit', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'evaluator' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await db('evaluation_results as r')
      .join('indicators as i', 'r.indicator_id', 'i.id')
      .where('r.id', req.params.id)
      .select('r.*', 'i.type as indicator_type')
      .first();

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Verify ownership
    if (req.user.role === 'evaluator' && result.evaluator_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Validate evidence for yes_no type
    if (result.indicator_type === 'yes_no' && result.value_yes_no === 1) {
      const hasEvidence = await db('attachments')
        .where({
          period_id: result.period_id,
          evaluatee_id: result.evaluatee_id,
          indicator_id: result.indicator_id
        })
        .first();
      
      if (!hasEvidence) {
        return res.status(400).json({ error: 'EVIDENCE_REQUIRED' });
      }
    }

    await db('evaluation_results')
      .where('id', req.params.id)
      .update({
        status: 'submitted'
      });

    const updated = await db('evaluation_results').where('id', req.params.id).first();
    res.json(updated);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to submit result' });
  }
});

// DELETE /api/results/:id - Delete result
router.delete('/:id', auth(), async (req, res) => {
  try {
    const result = await db('evaluation_results').where('id', req.params.id).first();
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Verify ownership
    if (req.user.role === 'evaluator' && result.evaluator_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    } else if (req.user.role !== 'admin' && req.user.role !== 'evaluator') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db('evaluation_results').where('id', req.params.id).delete();
    res.json({ message: 'Result deleted successfully' });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to delete result' });
  }
});

module.exports = router;
