const test = require('node:test');
const assert = require('node:assert');
const { Mat33 } = require('../js/math.js');

test('Mat33', async (t) => {
  await t.test('identity', () => {
    const expected = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const result = Mat33.identity();
    assert.deepStrictEqual(result, expected, 'Mat33.identity() should return the 3x3 identity matrix');
  });
});
