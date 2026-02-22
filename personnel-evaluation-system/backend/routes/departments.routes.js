// routes/departments.routes.js
const router = require('express').Router();
const db = require('../db/knex');
const auth = require('../middlewares/auth');

// GET /api/departments - List all departments
router.get('/', auth(), async (req, res) => {
  try {
    const departments = await db('departments')
      .select('*')
      .orderBy('name_th');
    res.json({ data: departments });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// GET /api/departments/:id - Get department by ID
router.get('/:id', auth(), async (req, res) => {
  try {
    const department = await db('departments')
      .where('id', req.params.id)
      .first();
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json(department);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// POST /api/departments - Create new department (admin only)
router.post('/', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { code, name_th, name_en } = req.body;

    const [id] = await db('departments').insert({
      code,
      name_th,
      name_en
    });

    const newDept = await db('departments').where('id', id).first();
    res.status(201).json(newDept);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PUT /api/departments/:id - Update department (admin only)
router.put('/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { code, name_th, name_en } = req.body;

    await db('departments')
      .where('id', req.params.id)
      .update({
        code,
        name_th,
        name_en,
        updated_at: db.fn.now()
      });

    const updated = await db('departments').where('id', req.params.id).first();
    res.json(updated);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// DELETE /api/departments/:id - Delete department (admin only)
router.delete('/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db('departments').where('id', req.params.id).delete();
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

module.exports = router;
