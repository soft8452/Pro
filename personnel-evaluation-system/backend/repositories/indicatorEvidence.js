// repositories/indicatorEvidence.js
exports.mapExists = async (a, b) => { // accept either (obj) or (indicator_id, evidence_type_id)
  const dbModule = require('../db/knex')
  const db = typeof dbModule === 'function' ? dbModule : (dbModule.default || dbModule)

  let indicator_id, evidence_type_id
  if (typeof a === 'object' && a !== null) {
    indicator_id = a.indicator_id
    evidence_type_id = a.evidence_type_id
  } else {
    indicator_id = a
    evidence_type_id = b
  }

  const row = await db('indicator_evidence')
    .where({ indicator_id, evidence_type_id })
    .first()
  return !!row
}
