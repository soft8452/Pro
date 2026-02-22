// routes/periods.routes.js
const router = require('express').Router();
const db = require('../db/knex');
const auth = require('../middlewares/auth');

// GET /api/periods - List all periods
router.get('/', auth(), async (req, res) => {
  try {
    const periods = await db('evaluation_periods')
      .select('*')
      .orderBy('buddhist_year', 'desc')
      .orderBy('id', 'desc');
    res.json({ data: periods });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch periods' });
  }
});

// GET /api/periods/active - Get active period
router.get('/active', auth(), async (req, res) => {
  try {
    const period = await db('evaluation_periods')
      .where('is_active', true)
      .first();
    
    if (!period) {
      return res.status(404).json({ error: 'No active period found' });
    }
    
    res.json(period);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch active period' });
  }
});

// GET /api/periods/:id - Get period by ID
router.get('/:id', auth(), async (req, res) => {
  try {
    const period = await db('evaluation_periods')
      .where('id', req.params.id)
      .first();
    
    if (!period) {
      return res.status(404).json({ error: 'Period not found' });
    }
    
    res.json(period);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch period' });
  }
});

// POST /api/periods - Create new period (admin only)
router.post('/', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { code, name_th, buddhist_year, start_date, end_date, is_active } = req.body;

    const [id] = await db('evaluation_periods').insert({
      code,
      name_th,
      buddhist_year: buddhist_year || new Date().getFullYear() + 543,
      start_date,
      end_date,
      is_active: is_active !== undefined ? is_active : false
    });

    const newPeriod = await db('evaluation_periods').where('id', id).first();
    res.status(201).json(newPeriod);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to create period' });
  }
});

// PUT /api/periods/:id - Update period (admin only)
router.put('/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { code, name_th, buddhist_year, start_date, end_date, is_active } = req.body;

    await db('evaluation_periods')
      .where('id', req.params.id)
      .update({
        code,
        name_th,
        buddhist_year,
        start_date,
        end_date,
        is_active
      });

    const updated = await db('evaluation_periods').where('id', req.params.id).first();
    res.json(updated);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to update period' });
  }
});

// PATCH /api/periods/:id/toggle - Toggle active status (admin only)
router.patch('/:id/toggle', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const current = await db('evaluation_periods').where('id', req.params.id).first();
    
    await db('evaluation_periods')
      .where('id', req.params.id)
      .update({
        is_active: !current.is_active
      });

    const updated = await db('evaluation_periods').where('id', req.params.id).first();
    res.json(updated);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to toggle period status' });
  }
});

// DELETE /api/periods/:id - Delete period (admin only)
router.delete('/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db('evaluation_periods').where('id', req.params.id).delete();
    res.json({ message: 'Period deleted successfully' });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to delete period' });
  }
});

module.exports = router;
