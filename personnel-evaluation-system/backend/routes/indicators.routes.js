// routes/indicators.routes.js
const router = require('express').Router();
const db = require('../db/knex');
const auth = require('../middlewares/auth');

// GET /api/indicators - List all indicators (with optional topic filter)
router.get('/', auth(), async (req, res) => {
  try {
    const { topic_id, period_id } = req.query;
    
    let query = db('indicators as i')
      .leftJoin('evaluation_topics as t', 'i.topic_id', 't.id')
      .select(
        'i.*',
        't.title_th as topic_name',
        't.code as topic_code'
      )
      .orderBy('i.topic_id')
      .orderBy('i.id');

    if (topic_id) {
      query = query.where('i.topic_id', topic_id);
    }

    const indicators = await query;
    res.json({ data: indicators });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch indicators' });
  }
});

// GET /api/indicators/:id - Get indicator by ID
router.get('/:id', auth(), async (req, res) => {
  try {
    const indicator = await db('indicators')
      .where('id', req.params.id)
      .first();
    
    if (!indicator) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    
    res.json(indicator);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch indicator' });
  }
});

// GET /api/indicators/:id/evidence-types - Get evidence types for indicator
router.get('/:id/evidence-types', auth(), async (req, res) => {
  try {
    const types = await db('indicator_evidence_types as iet')
      .join('evidence_types as et', 'iet.evidence_type_id', 'et.id')
      .where('iet.indicator_id', req.params.id)
      .select('et.*');
    
    res.json(types);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch evidence types' });
  }
});

// POST /api/indicators - Create new indicator (admin only)
router.post('/', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { topic_id, code, name_th, description, type, weight, min_score, max_score, active } = req.body;

    const [id] = await db('indicators').insert({
      topic_id,
      code,
      name_th,
      description,
      type: type || 'score_1_4',
      weight: weight || 1.0,
      min_score: min_score || 1,
      max_score: max_score || 4,
      active: active !== undefined ? active : true
    });

    const newIndicator = await db('indicators').where('id', id).first();
    res.status(201).json(newIndicator);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to create indicator' });
  }
});

// PUT /api/indicators/:id - Update indicator (admin only)
router.put('/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { topic_id, code, name_th, description, type, weight, min_score, max_score, active } = req.body;

    await db('indicators')
      .where('id', req.params.id)
      .update({
        topic_id,
        code,
        name_th,
        description,
        type,
        weight,
        min_score,
        max_score,
        active
      });

    const updated = await db('indicators').where('id', req.params.id).first();
    res.json(updated);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to update indicator' });
  }
});

// DELETE /api/indicators/:id - Delete indicator (admin only)
router.delete('/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db('indicators').where('id', req.params.id).delete();
    res.json({ message: 'Indicator deleted successfully' });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to delete indicator' });
  }
});

module.exports = router;
