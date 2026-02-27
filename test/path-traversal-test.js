// Manual test for path traversal vulnerability
const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 8080,
  path: '/../../../etc/passwd',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Response: ${data.substring(0, 200)}`);
    if (res.statusCode === 403) {
      console.log('\n✓ Path traversal protection is working!');
    } else {
      console.log('\n✗ WARNING: Path traversal may be possible!');
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();
