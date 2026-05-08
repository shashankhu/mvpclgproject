// Test the dashboard API by making a real request
const http = require('http');

// First login to get a valid token
const loginData = JSON.stringify({ email: 'admin@college.edu', password: 'password123' });

const loginReq = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('LOGIN STATUS:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      if (parsed.token) {
        console.log('LOGIN OK, testing dashboard...');
        testApi(parsed.token, '/api/dashboard');
        testApi(parsed.token, '/api/vendors');
      } else {
        console.log('LOGIN RESPONSE:', data.substring(0, 300));
      }
    } catch(e) {
      console.log('LOGIN PARSE ERROR:', data.substring(0, 300));
    }
  });
});
loginReq.on('error', e => console.log('LOGIN ERROR:', e.message));
loginReq.write(loginData);
loginReq.end();

function testApi(token, path) {
  const req = http.request({
    hostname: '127.0.0.1',
    port: 3000,
    path: path,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`\n${path} STATUS: ${res.statusCode}`);
      console.log(`${path} BODY:`, data.substring(0, 500));
    });
  });
  req.on('error', e => console.log(`${path} ERROR:`, e.message));
  req.end();
}
