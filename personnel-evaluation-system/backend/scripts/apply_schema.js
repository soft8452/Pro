const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

async function main() {
  const sqlFile = path.resolve(__dirname, '../../schema.sql')
  if (!fs.existsSync(sqlFile)) {
    console.error('schema.sql not found at', sqlFile)
    process.exit(1)
  }
  const sql = fs.readFileSync(sqlFile, 'utf8')

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  })

  try {
    console.log('Applying schema...')
    await conn.query(sql)
    console.log('Schema applied successfully')
    await conn.end()
    process.exit(0)
  } catch (err) {
    console.error('Failed to apply schema:', err)
    await conn.end()
    process.exit(1)
  }
}

main()
