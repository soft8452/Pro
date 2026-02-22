const mysql = require('mysql2/promise');

async function checkUser() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'skills_db'
  });
  
  const [rows] = await conn.query(
    "SELECT id, email, password_hash FROM users WHERE email='admin@ccollege.ac.th'"
  );
  
  console.log('Admin User:');
  console.log(rows);
  
  await conn.end();
}

checkUser().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
