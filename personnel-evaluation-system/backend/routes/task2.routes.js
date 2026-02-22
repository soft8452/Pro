// backend/routes/task2.routes.js
// Task 2: Evidence Submit Rule
const router = require('express').Router();
const db = require('../db/knex');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

/**
 * POST /task2/evidence
 * Upload evidence with validation
 */
router.post('/evidence', auth('evaluatee', 'evaluator'), upload.array('files', 10), async (req, res, next) => {
  try {
    const { indicator_id, evidence_type_id, description, period_id } = req.body;
    const { id: userId, role } = req.user;

    if (!indicator_id || !req.files || req.files.length === 0) {
      return res.status(422).json({ error: 'indicator_id and files are required' });
    }

    // Get active period if not specified
    let targetPeriodId = period_id;
    if (!targetPeriodId) {
      const activePeriod = await db('evaluation_periods')
        .where({ is_active: 1 })
        .first();
      if (!activePeriod) {
        return res.status(400).json({ error: 'No active period found' });
      }
      targetPeriodId = activePeriod.id;
    }

    // Verify indicator exists and is active
    const indicator = await db('indicators')
      .where({ id: indicator_id, active: 1 })
      .first();
    if (!indicator) {
      return res.status(404).json({ error: 'Indicator not found or inactive' });
    }

    // Get evaluatee_id based on role
    let evaluatee_id;
    if (role === 'evaluatee') {
      evaluatee_id = userId;
      
      // Verify user is in this period
      const assignment = await db('assignments')
        .where({ period_id: targetPeriodId, evaluatee_id: userId })
        .first();
      if (!assignment) {
        return res.status(403).json({ error: 'You are not assigned in this period' });
      }
    } else if (role === 'evaluator') {
      evaluatee_id = req.body.evaluatee_id;
      if (!evaluatee_id) {
        return res.status(422).json({ error: 'evaluatee_id required for evaluator' });
      }
      
      // Verify evaluator is assigned to this evaluatee
      const assignment = await db('assignments')
        .where({ 
          period_id: targetPeriodId, 
          evaluator_id: userId, 
          evaluatee_id 
        })
        .first();
      if (!assignment) {
        return res.status(403).json({ error: 'Not assigned to this evaluatee in this period' });
      }
    }

    // Get default evidence_type_id if not provided
    let finalEvidenceTypeId = evidence_type_id;
    if (!finalEvidenceTypeId) {
      const defaultType = await db('evidence_types').first();
      if (defaultType) {
        finalEvidenceTypeId = defaultType.id;
      } else {
        // Create a default evidence type
        const [newTypeId] = await db('evidence_types').insert({
          code: 'default',
          name_th: 'หลักฐานทั่วไป'
        });
        finalEvidenceTypeId = newTypeId;
      }
    }

    // Insert all uploaded files
    const uploadedFiles = [];
    for (const file of req.files) {
      const [id] = await db('attachments').insert({
        period_id: targetPeriodId,
        evaluatee_id,
        indicator_id,
        evidence_type_id: finalEvidenceTypeId,
        file_name: file.originalname,
        mime_type: file.mimetype,
        size_bytes: file.size,
        storage_path: file.path
      });

      uploadedFiles.push({
        id,
        file_name: file.originalname,
        mime_type: file.mimetype,
        size_bytes: file.size
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Evidence uploaded successfully',
      data: uploadedFiles,
      meta: {
        indicator_id: Number(indicator_id),
        period_id: Number(targetPeriodId),
        evaluatee_id
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /task2/results/:id/submit
 * กฎการส่งหลักฐาน: ถ้า indicator.type='yes_no' และ yes_no=1 
 * แต่ไม่มีไฟล์ใน attachments → ส่งไม่ได้
 */
router.patch('/results/:id/submit', auth('evaluator', 'evaluatee'), async (req, res, next) => {
  try {
    const resultId = parseInt(req.params.id);
    
    // ดึงข้อมูลผลการประเมิน
    const result = await db('evaluation_results')
      .where({ id: resultId })
      .first();

    if (!result) {
      return res.status(404).json({ error: 'result not found' });
    }

    // ตรวจสอบสิทธิ์
    const { id: currentUserId, role } = req.user;
    if (role === 'evaluatee' && result.evaluatee_id !== currentUserId) {
      return res.status(403).json({ error: 'forbidden' });
    }
    if (role === 'evaluator' && result.evaluator_id !== currentUserId) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // ดึงข้อมูล indicator
    const indicator = await db('indicators')
      .where({ id: result.indicator_id })
      .first();

    // ตรวจสอบกฎหลักฐาน
    if (indicator.type === 'yes_no' && result.value_yes_no === 1) {
      // ต้องมีไฟล์แนบ
      const attachment = await db('attachments')
        .where({
          period_id: result.period_id,
          evaluatee_id: result.evaluatee_id,
          indicator_id: result.indicator_id
        })
        .first();

      if (!attachment) {
        return res.status(400).json({ error: 'EVIDENCE_REQUIRED' });
      }
    }

    // อัปเดตสถานะเป็น submitted
    await db('evaluation_results')
      .where({ id: resultId })
      .update({
        status: 'submitted',
        updated_at: db.fn.now()
      });

    // บันทึกเวลาส่ง (ถ้ามีคอลัมน์)
    const columns = await db('evaluation_results').columnInfo();
    if (columns.submitted_at) {
      await db('evaluation_results')
        .where({ id: resultId })
        .update({ submitted_at: db.fn.now() });
    }

    const updated = await db('evaluation_results')
      .where({ id: resultId })
      .first();

    return res.status(200).json({
      success: true,
      data: updated
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
