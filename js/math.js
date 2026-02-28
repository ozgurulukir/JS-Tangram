/**
 * MATRIX TRANSFORMATION UTILITY (Homogeneous Coordinates)
 * Inspired by "Representing 2D Transformations as Matrices"
 */
const Mat33 = {
  identity: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
  multiply: (a, b) => {
    const res = new Array(9).fill(0);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          res[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
        }
      }
    }
    return res;
  },
  translate: (tx, ty) => [1, 0, 0, 0, 1, 0, tx, ty, 1],
  rotate: (deg) => {
    const rad = deg * Math.PI / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [c, s, 0, -s, c, 0, 0, 0, 1];
  },
  scale: (sx, sy) => [sx, 0, 0, 0, sy, 0, 0, 0, 1],
  point: (m, p) => ({
    x: p.x * m[0] + p.y * m[3] + m[6],
    y: p.x * m[1] + p.y * m[4] + m[7]
  }),
  // Helper to generate a piece's transformation matrix
  getTransformMatrix: (x, y, r, sx, offX, offY, UNIT) => {
    let m = Mat33.translate(-offX * UNIT, -offY * UNIT); // Pivot to origin
    m = Mat33.multiply(m, Mat33.scale(sx, 1));
    m = Mat33.multiply(m, Mat33.rotate(r));
    m = Mat33.multiply(m, Mat33.translate(x, y));
    return m;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Mat33 };
}
