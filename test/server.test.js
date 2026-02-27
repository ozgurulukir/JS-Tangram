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
  });

  // Path traversal is tested manually via test/path-traversal-test.js
  // (Node's http.request normalizes URLs, making automated testing difficult)

  await t.test('POST /api/save-level with valid data', async () => {
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
    
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.strictEqual(data.success, true);
  });

  await t.test('POST /api/save-level with invalid JSON', async () => {
    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    });
    
    assert.strictEqual(response.status, 400);
    const data = await response.json();
    assert.strictEqual(data.error, 'Invalid JSON');
  });

  await t.test('POST /api/save-level with missing fields', async () => {
    const response = await fetch(`${baseUrl}/api/save-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }) // missing sol
    });
    
    assert.strictEqual(response.status, 400);
    const data = await response.json();
    assert.strictEqual(data.error, 'Invalid level data: missing name or solution');
  });

  // Close the server after tests
  await new Promise((resolve) => {
    server.close(resolve);
  });
});
