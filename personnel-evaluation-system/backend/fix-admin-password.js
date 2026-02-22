const mysql = require('mysql2/promise');

async function updatePassword() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'skills_db'
  });
  
  const newHash = '$2b$10$dD8r6vuLOvYyg8R9R/HCcebOmi7Daykjz9rLttlBrxoEIjvEgnevu';
  
  const [result] = await conn.query(
    "UPDATE users SET password_hash=? WHERE email='admin@ccollege.ac.th'",
    [newHash]
  );
  
  console.log('✅ Admin password updated!');
  console.log(`Rows affected: ${result.affectedRows}`);
  console.log('\nNow try login with:');
  console.log('  Email: admin@ccollege.ac.th');
  console.log('  Password: admin123');
  
  await conn.end();
}

updatePassword().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
