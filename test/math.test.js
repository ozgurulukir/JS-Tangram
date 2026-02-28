const test = require('node:test');
const assert = require('node:assert');
const { Mat33 } = require('../js/math.js');

test('Mat33 - Matrix Math Utilities', async (t) => {
  await t.test('identity returns correct 3x3 identity matrix', () => {
    const id = Mat33.identity();
    assert.deepStrictEqual(id, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  await t.test('multiply multiplies two matrices correctly', () => {
    const id = Mat33.identity();
    const a = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // id * a = a
    assert.deepStrictEqual(Mat33.multiply(id, a), a);
    // a * id = a
    assert.deepStrictEqual(Mat33.multiply(a, id), a);

    const b = [9, 8, 7, 6, 5, 4, 3, 2, 1];
    const expectedA_B = [
      30, 24, 18,
      84, 69, 54,
      138, 114, 90
    ];
    assert.deepStrictEqual(Mat33.multiply(a, b), expectedA_B);
  });

  await t.test('translate generates correct translation matrix', () => {
    const tx = 5, ty = -3;
    const expected = [1, 0, 0, 0, 1, 0, 5, -3, 1];
    assert.deepStrictEqual(Mat33.translate(tx, ty), expected);
  });

  await t.test('rotate generates correct rotation matrix (degrees)', () => {
    const rot90 = Mat33.rotate(90);
    // cos(90) = 0, sin(90) = 1
    // [c, s, 0, -s, c, 0, 0, 0, 1]

    // Check against expected values with small float precision allowance
    assert.ok(Math.abs(rot90[0] - 0) < 1e-10); // c
    assert.ok(Math.abs(rot90[1] - 1) < 1e-10); // s
    assert.strictEqual(rot90[2], 0);
    assert.ok(Math.abs(rot90[3] - (-1)) < 1e-10); // -s
    assert.ok(Math.abs(rot90[4] - 0) < 1e-10); // c
    assert.strictEqual(rot90[5], 0);
    assert.strictEqual(rot90[6], 0);
    assert.strictEqual(rot90[7], 0);
    assert.strictEqual(rot90[8], 1);
  });

  await t.test('scale generates correct scaling matrix', () => {
    const sx = 2, sy = 0.5;
    const expected = [2, 0, 0, 0, 0.5, 0, 0, 0, 1];
    assert.deepStrictEqual(Mat33.scale(sx, sy), expected);
  });

  await t.test('point transforms a 2D point using a matrix', () => {
    const p = { x: 10, y: 20 };

    // Translation
    const tm = Mat33.translate(5, -5);
    const tp = Mat33.point(tm, p);
    assert.strictEqual(tp.x, 15);
    assert.strictEqual(tp.y, 15);

    // Scaling
    const sm = Mat33.scale(2, 0.5);
    const sp = Mat33.point(sm, p);
    assert.strictEqual(sp.x, 20);
    assert.strictEqual(sp.y, 10);

    // Rotation (90 deg)
    const rm = Mat33.rotate(90);
    const rp = Mat33.point(rm, p);
    // x' = x*cos(90) - y*sin(90) = 0 - 20 = -20
    // y' = x*sin(90) + y*cos(90) = 10 + 0 = 10
    // Since our matrix layout is point-vector multiplication:
    // m = [c, s, 0, -s, c, 0, 0, 0, 1]
    // rp.x = x*c + y*(-s) + tx
    // rp.y = x*s + y*c + ty
    assert.ok(Math.abs(rp.x - (-20)) < 1e-10);
    assert.ok(Math.abs(rp.y - 10) < 1e-10);
  });

  await t.test('getTransformMatrix combines matrices correctly', () => {
    const x = 100;
    const y = 200;
    const r = 90;
    const sx = 1; // scaleX
    const offX = 1;
    const offY = 1;
    const UNIT = 10;

    // This should do: translate(-offX*UNIT, -offY*UNIT) -> scale(sx, 1) -> rotate(r) -> translate(x, y)
    const m = Mat33.getTransformMatrix(x, y, r, sx, offX, offY, UNIT);

    // Let's test by transforming a point (e.g. the origin of the piece)
    // The point (offX * UNIT, offY * UNIT) = (10, 10) should map to (x, y) = (100, 200)
    // because after translating by -off (so it becomes 0,0), scaling (still 0,0), rotating (still 0,0) and translating by (x,y), it's (x,y)
    const p = { x: 10, y: 10 };
    const pTransformed = Mat33.point(m, p);

    assert.ok(Math.abs(pTransformed.x - 100) < 1e-10);
    assert.ok(Math.abs(pTransformed.y - 200) < 1e-10);
  });
});
