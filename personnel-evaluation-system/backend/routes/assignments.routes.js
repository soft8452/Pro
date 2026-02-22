// routes/assignments.routes.js
const router = require('express').Router();
const db = require('../db/knex');
const auth = require('../middlewares/auth');

// GET /api/assignments/my-tasks - Get my tasks (for evaluator)
router.get('/my-tasks', auth(), async (req, res) => {
  try {
    const { period_id, department_id } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase();

    let query = db('assignments as a')
      .leftJoin('users as evaluatee', 'a.evaluatee_id', 'evaluatee.id')
      .leftJoin('departments as d', 'a.dept_id', 'd.id')
      .leftJoin('evaluation_periods as p', 'a.period_id', 'p.id')
      .select(
        'a.*',
        'evaluatee.name_th as evaluatee_name',
        'evaluatee.email as evaluatee_email',
        'd.name_th as department_name',
        'p.name_th as period_name'
      )
      .orderBy('a.id', 'desc');

    // Filter by role
    if (userRole === 'evaluator') {
      query = query.where('a.evaluator_id', userId);
    } else if (userRole === 'evaluatee') {
      query = query.where('a.evaluatee_id', userId);
    }

    // Apply filters
    if (period_id) query = query.where('a.period_id', period_id);
    if (department_id) query = query.where('a.dept_id', department_id);
    // Note: status filtering removed - status is calculated dynamically

    const assignments = await query;

    // Calculate progress for each assignment
    const result = await Promise.all(assignments.map(async (a) => {
      const totalIndicators = await db('indicators').where('active', true).count('id as count').first();
      const submittedResults = await db('evaluation_results')
        .where({ 
          period_id: a.period_id, 
          evaluatee_id: a.evaluatee_id,
          evaluator_id: a.evaluator_id,
          status: 'submitted' 
        })
        .count('id as count')
        .first();
      
      const total = totalIndicators?.count || 0;
      const submitted = submittedResults?.count || 0;
      const progress = total > 0 ? Math.round((submitted / total) * 100) : 0;

      return {
        ...a,
        progress,
        status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending'
      };
    }));

    res.json({ data: result });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch my tasks' });
  }
});

// GET /api/assignments - List assignments with filters
router.get('/', auth(), async (req, res) => {
  try {
    const { period_id, dept_id, evaluator_id, evaluatee_id } = req.query;
    
    let query = db('assignments as a')
      .leftJoin('users as evaluator', 'a.evaluator_id', 'evaluator.id')
      .leftJoin('users as evaluatee', 'a.evaluatee_id', 'evaluatee.id')
      .leftJoin('departments as d', 'a.dept_id', 'd.id')
      .leftJoin('evaluation_periods as p', 'a.period_id', 'p.id')
      .select(
        'a.*',
        'evaluator.name_th as evaluator_name',
        'evaluator.email as evaluator_email',
        'evaluatee.name_th as evaluatee_name',
        'evaluatee.email as evaluatee_email',
        'd.name_th as dept_name',
        'p.name_th as period_name'
      )
      .orderBy('a.id', 'desc');

    // Apply filters
    if (period_id) query = query.where('a.period_id', period_id);
    if (dept_id) query = query.where('a.dept_id', dept_id);
    if (evaluator_id) query = query.where('a.evaluator_id', evaluator_id);
    if (evaluatee_id) query = query.where('a.evaluatee_id', evaluatee_id);
    // Note: status filtering removed - status column doesn't exist

    // Role-based filtering
    if (req.user.role === 'evaluator') {
      query = query.where('a.evaluator_id', req.user.id);
    } else if (req.user.role === 'evaluatee') {
      query = query.where('a.evaluatee_id', req.user.id);
    }

    const assignments = await query;
    res.json({ data: assignments });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// GET /api/assignments/:id - Get assignment by ID
router.get('/:id', auth(), async (req, res) => {
  try {
    const assignment = await db('assignments as a')
      .leftJoin('users as evaluator', 'a.evaluator_id', 'evaluator.id')
      .leftJoin('users as evaluatee', 'a.evaluatee_id', 'evaluatee.id')
      .leftJoin('departments as d', 'a.dept_id', 'd.id')
      .leftJoin('evaluation_periods as p', 'a.period_id', 'p.id')
      .where('a.id', req.params.id)
      .select(
        'a.*',
        'evaluator.name_th as evaluator_name',
        'evaluatee.name_th as evaluatee_name',
        'd.name_th as dept_name',
        'p.name_th as period_name'
      )
      .first();
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check access rights
    if (req.user.role === 'evaluator' && assignment.evaluator_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role === 'evaluatee' && assignment.evaluatee_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.json(assignment);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// POST /api/assignments - Create new assignment (admin only)
router.post('/', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { period_id, dept_id, evaluator_id, evaluatee_id } = req.body;

    // Check for duplicate
    const existing = await db('assignments')
      .where({
        period_id,
        evaluator_id,
        evaluatee_id
      })
      .first();

    if (existing) {
      return res.status(409).json({ error: 'DUPLICATE_ASSIGNMENT' });
    }

    const [id] = await db('assignments').insert({
      period_id,
      dept_id,
      evaluator_id,
      evaluatee_id
    });

    const newAssignment = await db('assignments').where('id', id).first();
    res.status(201).json(newAssignment);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// PUT /api/assignments/:id - Update assignment (admin only)
router.put('/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { period_id, dept_id, evaluator_id, evaluatee_id } = req.body;

    await db('assignments')
      .where('id', req.params.id)
      .update({
        period_id,
        dept_id,
        evaluator_id,
        evaluatee_id
      });

    const updated = await db('assignments').where('id', req.params.id).first();
    res.json(updated);
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// PATCH /api/assignments/:id/cancel - Cancel assignment (admin only)
router.patch('/:id/cancel', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Status column doesn't exist - just delete the record
    await db('assignments')
      .where('id', req.params.id)
      .delete();

    res.json({ message: 'Assignment cancelled successfully' });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to cancel assignment' });
  }
});

// DELETE /api/assignments/:id - Delete assignment (admin only)
router.delete('/:id', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db('assignments').where('id', req.params.id).delete();
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

module.exports = router;
