const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
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

  // Close the server after tests
  await new Promise((resolve) => {
    server.close(resolve);
  });
});
