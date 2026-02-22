// routes/topics.routes.js
const router = require('express').Router();
const db = require('../db/knex');
const auth = require('../middlewares/auth');

// GET /api/topics - List all topics
router.get('/', auth(), async (req, res) => {
  console.log('[TOPICS] GET / - start');
  try {
    console.log('[TOPICS] querying database...');
    const topics = await db('evaluation_topics')
      .select('*')
      .orderBy('id');
    console.log('[TOPICS] query done, rows:', topics.length);
    res.json({ data: topics });
  } catch (err) {
    console.error('[TOPICS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// GET /api/topics/:id - Get topic by ID
router.get('/:id', auth(), async (req, res) => {
  try {
    const topic = await db('evaluation_topics')
      .where('id', req.params.id)
      .first();
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json(topic);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

// POST /api/topics - Create new topic (admin only)
router.post('/', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { code, title_th, description, weight, active } = req.body;

    const [id] = await db('evaluation_topics').insert({
      code,
      title_th,
      description,
      weight: weight || 1.0,
      active: active !== undefined ? active : true
    });

    const newTopic = await db('evaluation_topics').where('id', id).first();
    res.status(201).json(newTopic);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// PUT /api/topics/:id - Update topic (admin only)
router.put('/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { code, title_th, description, weight, active } = req.body;

    await db('evaluation_topics')
      .where('id', req.params.id)
      .update({
        code,
        title_th,
        description,
        weight,
        active
      });

    const updated = await db('evaluation_topics').where('id', req.params.id).first();
    res.json(updated);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

// DELETE /api/topics/:id - Delete topic (admin only)
router.delete('/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db('evaluation_topics').where('id', req.params.id).delete();
    res.json({ message: 'Topic deleted successfully' });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

module.exports = router;
