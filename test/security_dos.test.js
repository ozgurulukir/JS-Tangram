const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// Set environment variables BEFORE requiring the server
process.env.MAX_LEVELS = '5';
process.env.API_TOKEN = 'test-token';

const server = require('../server.js');

const levelsPath = path.join(__dirname, '../levels.json');
const levelsBackupPath = path.join(__dirname, '../levels.json.bak');

test.before(() => {
  if (fs.existsSync(levelsPath)) {
    fs.copyFileSync(levelsPath, levelsBackupPath);
  }
});

test.after(() => {
  if (fs.existsSync(levelsBackupPath)) {
    fs.copyFileSync(levelsBackupPath, levelsPath);
    fs.unlinkSync(levelsBackupPath);
  }
});

test('Security DoS Protection - Level Limit', async (t) => {
  let address;

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      address = server.address();
      resolve();
    });
  });

  const baseUrl = `http://127.0.0.1:${address.port}`;

  await t.test('enforces MAX_LEVELS limit', async () => {
    // 1. Clear levels.json to start fresh
    fs.writeFileSync(levelsPath, '[]', 'utf8');

    const saveLevel = async (name) => {
      return await fetch(`${baseUrl}/api/save-level`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_TOKEN}`
        },
        body: JSON.stringify({ name, sol: { T1: { x: 0, y: 0 } } })
      });
    };

    // Add 5 levels (the limit)
    for (let i = 1; i <= 5; i++) {
      const res = await saveLevel(`Level ${i}`);
      assert.strictEqual(res.status, 200, `Failed to save Level ${i}`);
    }

    // Attempt to add the 6th level
    const res6 = await saveLevel('Level 6');
    assert.strictEqual(res6.status, 400);
    const data6 = await res6.json();
    assert.strictEqual(data6.error, 'Maximum level limit reached');

    // Verify that updating an existing level still works
    const resUpdate = await saveLevel('Level 1');
    assert.strictEqual(resUpdate.status, 200);
    const dataUpdate = await resUpdate.json();
    assert.strictEqual(dataUpdate.success, true);
  });

  await new Promise((resolve) => {
    server.close(resolve);
  });
});
