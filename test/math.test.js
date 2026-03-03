const test = require('node:test');
const assert = require('node:assert');
const { Mat33 } = require('../js/math.js');

test('Mat33', async (t) => {
  await t.test('identity', () => {
    const expected = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const result = Mat33.identity();
    assert.deepStrictEqual(result, expected, 'Mat33.identity() should return the 3x3 identity matrix');
  });

  await t.test('multiply', () => {
    const identity = Mat33.identity();
    const a = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Identity property
    assert.deepStrictEqual(Mat33.multiply(identity, a), a, 'Identity * A should be A');
    assert.deepStrictEqual(Mat33.multiply(a, identity), a, 'A * Identity should be A');

    // Arbitrary multiplication
    const b = [9, 8, 7, 6, 5, 4, 3, 2, 1];
    const expectedAB = [30, 24, 18, 84, 69, 54, 138, 114, 90];
    assert.deepStrictEqual(Mat33.multiply(a, b), expectedAB, 'A * B should match expected result');
  });
});
