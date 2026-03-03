const test = require('node:test');
const assert = require('node:assert');
const { Mat33 } = require('../js/math.js');

test('Mat33', async (t) => {
  await t.test('identity', () => {
    const expected = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const result = Mat33.identity();
    assert.deepStrictEqual(result, expected, 'Mat33.identity() should return the 3x3 identity matrix');
  });

  await t.test('translate', async (t) => {
    await t.test('positive coordinates', () => {
      const expected = [1, 0, 0, 0, 1, 0, 5, 10, 1];
      const result = Mat33.translate(5, 10);
      assert.deepStrictEqual(result, expected, 'Mat33.translate() should return correct matrix for positive coords');
    });

    await t.test('negative coordinates', () => {
      const expected = [1, 0, 0, 0, 1, 0, -3, -8, 1];
      const result = Mat33.translate(-3, -8);
      assert.deepStrictEqual(result, expected, 'Mat33.translate() should return correct matrix for negative coords');
    });

    await t.test('zero coordinates', () => {
      const expected = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      const result = Mat33.translate(0, 0);
      assert.deepStrictEqual(result, expected, 'Mat33.translate() should return correct matrix for zero coords');
    });

    await t.test('floating point coordinates', () => {
      const expected = [1, 0, 0, 0, 1, 0, 1.5, -2.5, 1];
      const result = Mat33.translate(1.5, -2.5);
      assert.deepStrictEqual(result, expected, 'Mat33.translate() should return correct matrix for floating point coords');
    });
  });
});
