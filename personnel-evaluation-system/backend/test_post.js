const http = require('http');

// First login to get token
const loginBody = JSON.stringify({ email: 'admin@ccollege.ac.th', password: 'admin123' });

const loginReq = http.request({
  hostname: 'localhost',
  port: 7000,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const token = json.accessToken;
    console.log('Token obtained');
    
    // Now test GET topics
    console.log('Sending GET /api/topics...');
    const getReq = http.request({
      hostname: 'localhost',
      port: 7000,
      path: '/api/topics',
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log('GET Response:', res2.statusCode, data2.slice(0, 200));
        process.exit(0);
      });
    });
    
    getReq.on('error', e => {
      console.log('GET Error:', e.message);
      process.exit(1);
    });
    
    getReq.setTimeout(10000, () => {
      console.log('GET Timeout!');
      getReq.destroy();
      process.exit(1);
    });
    
    getReq.end();
  });
});

loginReq.on('error', e => {
  console.log('Login Error:', e.message);
  process.exit(1);
});

loginReq.write(loginBody);
loginReq.end();
