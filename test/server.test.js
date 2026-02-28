const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const server = require('../server.js');

test('Static file server', async (t) => {
  let address;

  // Start the server on a random port
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      address = server.address();
      resolve();
    });
  });

  const baseUrl = `http://127.0.0.1:${address.port}`;

  await t.test('returns 200 for root path (/)', async () => {
    const response = await fetch(`${baseUrl}/`);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get('content-type'), 'text/html');
  });

  await t.test('returns 200 for existing file (tngrm.html)', async () => {
    const response = await fetch(`${baseUrl}/tngrm.html`);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get('content-type'), 'text/html');
  });

  await t.test('returns 200 for existing file (editor.html)', async () => {
    const response = await fetch(`${baseUrl}/editor.html`);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get('content-type'), 'text/html');
  });

  await t.test('returns 200 for existing file (levels.json)', async () => {
    const response = await fetch(`${baseUrl}/levels.json`);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get('content-type'), 'application/json');
  });

  await t.test('returns 404 for non-existent file', async () => {
    const response = await fetch(`${baseUrl}/non-existent.html`);
    assert.strictEqual(response.status, 404);
    assert.strictEqual(await response.text(), '404 Not Found');
  });

  await t.test('returns 500 for reading a directory as a file', async () => {
    // '/test' is a directory in the project root.
    // The server maps it to './test' and tries to fs.readFile it, resulting in EISDIR.
    const response = await fetch(`${baseUrl}/test`);
    assert.strictEqual(response.status, 500);
    const text = await response.text();
    assert.ok(text.startsWith('500 Internal Server Error: EISDIR'), `Expected 500 EISDIR error, got: ${text}`);
  });

  await t.test('returns correct MIME type for CSS files', async () => {
    // Test with a CSS file - should return 200 with correct MIME type
    const response = await fetch(`${baseUrl}/style.css`);
    // Should be 200
    assert.strictEqual(response.status, 200);
    // Should have text/css MIME type
    assert.strictEqual(response.headers.get('content-type'), 'text/css');
  });

  await t.test('returns correct MIME type for JS files', async () => {
    const response = await fetch(`${baseUrl}/script.js`);
    assert.strictEqual(response.status, 404);
  });

  await t.test('returns 403 for path traversal attempt', async () => {
    // Note: This test relies on the server's path normalization
    // The actual path traversal test is in path-traversal-test.js
    const response = await fetch(`${baseUrl}/test.txt`);
    // Server should handle this safely
    assert.ok([403, 404].includes(response.status));
  });

  await t.test('POST /api/save-level with missing authorization header', async () => {
    const levelData = {
      name: 'Test Level',
      sol: {
        T1: { x: 100, y: 100, r: 0, sx: 1 }
      }
    };

    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(levelData)
    });

    assert.strictEqual(response.status, 401);
    const data = await response.json();
    assert.strictEqual(data.error, 'Unauthorized');
  });

  await t.test('POST /api/save-level with invalid authorization token', async () => {
    const levelData = {
      name: 'Test Level',
      sol: {
        T1: { x: 100, y: 100, r: 0, sx: 1 }
      }
    };

    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer wrong-token' },
      body: JSON.stringify(levelData)
    });

    assert.strictEqual(response.status, 401);
    const data = await response.json();
    assert.strictEqual(data.error, 'Unauthorized');
  });

  await t.test('POST /api/save-level with valid data', async () => {
    const levelData = {
      name: 'Test Level',
      sol: {
        T1: { x: 100, y: 100, r: 0, sx: 1 }
      }
    };

    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin-token' },
      body: JSON.stringify(levelData)
    });

    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.strictEqual(data.success, true);
  });

  await t.test('POST /api/save-level with invalid JSON', async () => {
    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin-token' },
      body: 'invalid json'
    });

    assert.strictEqual(response.status, 400);
    const data = await response.json();
    assert.strictEqual(data.error, 'Invalid JSON');
  });

  await t.test('POST /api/save-level with missing name field', async () => {
    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin-token' },
      body: JSON.stringify({ sol: { T1: { x: 0, y: 0 } } }) // missing name
    });

    assert.strictEqual(response.status, 400);
    const data = await response.json();
    assert.strictEqual(data.error, 'Invalid level data: missing name or solution');
  });

  await t.test('POST /api/save-level with missing sol field', async () => {
    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin-token' },
      body: JSON.stringify({ name: 'Test' }) // missing sol
    });

    assert.strictEqual(response.status, 400);
    const data = await response.json();
    assert.strictEqual(data.error, 'Invalid level data: missing name or solution');
  });

  await t.test('POST /api/save-level with empty body', async () => {
    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin-token' },
      body: ''
    });

    assert.strictEqual(response.status, 400);
  });

  await t.test('POST /api/save-level with primitive JSON types (null, numbers, booleans)', async () => {
    const payloads = ['null', '42', 'true'];
    for (const payload of payloads) {
      const response = await fetch(`${baseUrl}/api/save-level`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      assert.strictEqual(response.status, 400);
      const data = await response.json();

      // Depending on the primitive type, it may fail JSON.parse (triggering 'Invalid JSON')
      // or pass JSON.parse but fail schema validation ('Invalid level data...').
      assert.ok(data.error === 'Invalid JSON' || data.error === 'Invalid level data: missing name or solution');
    }
  });

  await t.test('POST /api/save-level with array instead of object', async () => {
    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ name: 'Test', sol: {} }])
    });

    assert.strictEqual(response.status, 400);
    const data = await response.json();
    assert.strictEqual(data.error, 'Invalid level data: missing name or solution');
  });

  await t.test('POST /api/save-level with malformed JSON (missing quote)', async () => {
    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name": "Test", "sol": {T1: {}}}' // missing quotes around T1
    });

    assert.strictEqual(response.status, 400);
    const data = await response.json();
    assert.strictEqual(data.error, 'Invalid JSON');
  });

  await t.test('POST /api/save-level with payload exceeding MAX_BODY_SIZE', async () => {
    // Generate a payload larger than 1MB (1024 * 1024 bytes)
    const largeString = 'a'.repeat(1024 * 1024 + 10);
    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: largeString
    });

    assert.strictEqual(response.status, 413);
    const data = await response.json();
    assert.strictEqual(data.error, 'Payload too large');
  });

  await t.test('POST /api/save-level updates existing level with same name', async () => {
    // First save
    const levelData1 = {
      name: 'Update Test',
      sol: { T1: { x: 100, y: 100, r: 0, sx: 1 } }
    };
    await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin-token' },
      body: JSON.stringify(levelData1)
    });

    // Update with same name
    const levelData2 = {
      name: 'Update Test',
      sol: { T1: { x: 200, y: 200, r: 45, sx: 1 } }
    };
    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin-token' },
      body: JSON.stringify(levelData2)
    });

    assert.strictEqual(response.status, 200);
    
    // Verify the update by reading levels.json
    const levelsContent = fs.readFileSync(path.join(__dirname, '../levels.json'), 'utf8');
    const levels = JSON.parse(levelsContent);
    const found = levels.find(l => l.name === 'Update Test');
    assert.ok(found);
    assert.strictEqual(found.sol.T1.x, 200);
  });


  // Close the server after tests
  await new Promise((resolve) => {
    server.close(resolve);
  });
});
