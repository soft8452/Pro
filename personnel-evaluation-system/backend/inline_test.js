// inline_test.js - Run express and test inline
const app = require('./app');
const http = require('http');

const server = app.listen(7001, () => {
  console.log('Test server on 7001');
  
  // Login first
  const loginBody = JSON.stringify({ email: 'admin@ccollege.ac.th', password: 'admin123' });
  const loginReq = http.request({
    hostname: 'localhost',
    port: 7001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      const json = JSON.parse(data);
      const token = json.accessToken;
      console.log('Got token');
      
      // Test GET /api/topics
      console.log('Testing GET /api/topics...');
      const getReq = http.request({
        hostname: 'localhost',
        port: 7001,
        path: '/api/topics',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }, (res2) => {
        let data2 = '';
        res2.on('data', c => data2 += c);
        res2.on('end', () => {
          console.log('Response:', res2.statusCode, data2.slice(0, 200));
          server.close();
          process.exit(0);
        });
      });
      
      getReq.on('error', e => {
        console.log('GET Error:', e.message);
        server.close();
        process.exit(1);
      });
      
      getReq.setTimeout(5000, () => {
        console.log('GET Timeout');
        server.close();
        process.exit(1);
      });
      
      getReq.end();
    });
  });
  
  loginReq.write(loginBody);
  loginReq.end();
});
