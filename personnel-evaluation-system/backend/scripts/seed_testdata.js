const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function main(){
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'skills_db'
  })

  try{
    // ensure indicator_evidence (2,3)
    await conn.query(`INSERT IGNORE INTO indicator_evidence (indicator_id,evidence_type_id) VALUES (2,3)`)
    // ensure user id=11
    await conn.query(`INSERT IGNORE INTO users (id,email,password_hash,name_th,role) VALUES (11,'t.test11@local','', 'Test 11', 'evaluatee')`)
    // ensure assignment for period 1 evaluator NULL evaluatee 11
    await conn.query(`INSERT IGNORE INTO assignments (period_id,evaluator_id,evaluatee_id) VALUES (1, NULL, 11)`)
    console.log('seed applied')
    await conn.end()
  }catch(e){
    console.error(e)
    await conn.end()
    process.exit(1)
  }
}

main()
