// test_api.js - Simple API test
const http = require('http');

const tests = [
  { name: 'Health Check', method: 'GET', path: '/health', needAuth: false },
];

async function testAPI(test, token = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 7000,
      path: test.path,
      method: test.method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (test.needAuth && token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ ${test.name}: ${res.statusCode}`, JSON.stringify(json).slice(0, 100));
          resolve({ success: true, data: json, status: res.statusCode });
        } catch (e) {
          console.log(`⚠️ ${test.name}: ${res.statusCode} - Not JSON`);
          resolve({ success: true, data, status: res.statusCode });
        }
      });
    });
    
    req.on('error', (e) => {
      console.log(`❌ ${test.name}: ${e.message}`);
      resolve({ success: false, error: e.message });
    });
    
    if (test.body) {
      req.write(JSON.stringify(test.body));
    }
    req.end();
  });
}

async function login() {
  return new Promise((resolve) => {
    const body = JSON.stringify({ email: 'admin@ccollege.ac.th', password: 'admin123' });
    const options = {
      hostname: 'localhost',
      port: 7000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const token = json.token || json.accessToken;
          console.log('✅ Login:', res.statusCode, token ? 'token obtained' : 'no token');
          resolve(token);
        } catch (e) {
          console.log('❌ Login parse error:', data);
          resolve(null);
        }
      });
    });
    
    req.on('error', (e) => {
      console.log('❌ Login error:', e.message);
      resolve(null);
    });
    
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('=== Testing Backend API ===\n');
  
  // Test health first
  await testAPI({ name: 'Health', method: 'GET', path: '/health' });
  
  // Login
  const token = await login();
  if (!token) {
    console.log('\n❌ Cannot proceed without token');
    return;
  }
  
  // Test all CRUD endpoints
  const crudTests = [
    { name: 'GET Topics', method: 'GET', path: '/api/topics' },
    { name: 'GET Indicators', method: 'GET', path: '/api/indicators' },
    { name: 'GET Periods', method: 'GET', path: '/api/periods' },
    { name: 'GET Departments', method: 'GET', path: '/api/departments' },
    { name: 'GET Users', method: 'GET', path: '/api/users' },
    { name: 'GET Assignments', method: 'GET', path: '/api/assignments' },
    { name: 'GET Results', method: 'GET', path: '/api/results' },
  ];
  
  console.log('\n--- CRUD Tests (with auth) ---');
  for (const test of crudTests) {
    await testAPI({ ...test, needAuth: true }, token);
  }
  
  console.log('\n=== Done ===');
}

runTests();
