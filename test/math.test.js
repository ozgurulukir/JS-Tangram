const test = require('node:test');
const assert = require('node:assert');
const { Mat33 } = require('../js/math.js');

test('Mat33.identity()', (t) => {
  const m = Mat33.identity();
  assert.deepStrictEqual(m, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
});

test('Mat33.translate()', (t) => {
  const m = Mat33.translate(5, -3);
  assert.deepStrictEqual(m, [1, 0, 0, 0, 1, 0, 5, -3, 1]);
});

test('Mat33.scale()', (t) => {
  const m = Mat33.scale(2, 0.5);
  assert.deepStrictEqual(m, [2, 0, 0, 0, 0.5, 0, 0, 0, 1]);
});

test('Mat33.rotate()', async (t) => {
  await t.test('rotates 0 degrees', () => {
    const m = Mat33.rotate(0);
    assert.deepStrictEqual(m, [1, 0, 0, -0, 1, 0, 0, 0, 1]);
  });

  await t.test('rotates 90 degrees', () => {
    const m = Mat33.rotate(90);
    // Math.cos(90deg) is close to 0, Math.sin(90deg) is 1
    assert.ok(Math.abs(m[0] - 0) < 1e-10); // cos(90)
    assert.ok(Math.abs(m[1] - 1) < 1e-10); // sin(90)
    assert.ok(Math.abs(m[3] - (-1)) < 1e-10); // -sin(90)
    assert.ok(Math.abs(m[4] - 0) < 1e-10); // cos(90)
  });

  await t.test('rotates 180 degrees', () => {
    const m = Mat33.rotate(180);
    assert.ok(Math.abs(m[0] - (-1)) < 1e-10); // cos(180)
    assert.ok(Math.abs(m[1] - 0) < 1e-10); // sin(180)
    assert.ok(Math.abs(m[3] - 0) < 1e-10); // -sin(180)
    assert.ok(Math.abs(m[4] - (-1)) < 1e-10); // cos(180)
  });
});

test('Mat33.multiply()', async (t) => {
  await t.test('multiplies identity by identity', () => {
    const id = Mat33.identity();
    const result = Mat33.multiply(id, id);
    assert.deepStrictEqual(result, id);
  });

  await t.test('multiplies translation by scale', () => {
    const t = Mat33.translate(10, 20);
    const s = Mat33.scale(2, 2);
    // Scale first, then translate
    const result = Mat33.multiply(s, t);
    // [2, 0, 0, 0, 2, 0, 0, 0, 1] * [1, 0, 0, 0, 1, 0, 10, 20, 1]
    // = [2, 0, 0, 0, 2, 0, 10, 20, 1]
    assert.deepStrictEqual(result, [2, 0, 0, 0, 2, 0, 10, 20, 1]);
  });
});

test('Mat33.point()', async (t) => {
  await t.test('translates point', () => {
    const tr = Mat33.translate(5, 5);
    const p = Mat33.point(tr, { x: 10, y: 10 });
    assert.strictEqual(p.x, 15);
    assert.strictEqual(p.y, 15);
  });

  await t.test('scales point', () => {
    const s = Mat33.scale(2, 3);
    const p = Mat33.point(s, { x: 10, y: 10 });
    assert.strictEqual(p.x, 20);
    assert.strictEqual(p.y, 30);
  });

  await t.test('rotates point', () => {
    const r = Mat33.rotate(90);
    const p = Mat33.point(r, { x: 10, y: 0 });
    // After 90 deg rotation, (10,0) becomes (0,10)
    assert.ok(Math.abs(p.x - 0) < 1e-10);
    assert.ok(Math.abs(p.y - 10) < 1e-10);
  });
});

test('Mat33.getTransformMatrix()', () => {
  // Test parameters: x=100, y=100, r=90, sx=2, offX=1, offY=1, UNIT=10
  // Pivot = -10, -10
  // Scale = 2, 1
  // Rotate = 90
  // Translate = 100, 100
  const m = Mat33.getTransformMatrix(100, 100, 90, 2, 1, 1, 10);

  // Test point at origin (0,0) which is locally the pivot (-10, -10) before translating
  // Let's use `point` to trace it:
  // p = (0,0)
  // 1. translate(-10, -10) -> (-10, -10)
  // 2. scale(2, 1) -> (-20, -10)
  // 3. rotate(90) -> (10, -20)
  // 4. translate(100, 100) -> (110, 80)

  const p = Mat33.point(m, { x: 0, y: 0 });
  assert.ok(Math.abs(p.x - 110) < 1e-10);
  assert.ok(Math.abs(p.y - 80) < 1e-10);
});
