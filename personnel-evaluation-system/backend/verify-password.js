const bcrypt = require('bcrypt');

const password = 'admin123';
const hash = '$2b$10$f6g9QMzpdIjzUyckEbFLIeuSRKEGJdNSu.TZ3tmegQ5ioSop02og6';

bcrypt.compare(password, hash, (err, matched) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  
  console.log(`Password "admin123" matches hash: ${matched}`);
  
  if (!matched) {
    console.log('\n⚠️  Password does NOT match!');
    console.log('Creating new hash for "admin123"...\n');
    
    bcrypt.hash(password, 10, (err, newHash) => {
      if (err) {
        console.error('Error:', err);
        process.exit(1);
      }
      
      console.log('New hash:');
      console.log(newHash);
      console.log('\nUpdate SQL:');
      console.log(`UPDATE users SET password_hash='${newHash}' WHERE email='admin@ccollege.ac.th';`);
    });
  } else {
    console.log('✅ Password is CORRECT!');
  }
});
