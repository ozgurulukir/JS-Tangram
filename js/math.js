const Mat33 = {
  identity: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
  multiply: (a, b) => {
    const b0 = b[0], b1 = b[1], b2 = b[2];
    const b3 = b[3], b4 = b[4], b5 = b[5];
    const b6 = b[6], b7 = b[7], b8 = b[8];

    let a0 = a[0], a1 = a[1], a2 = a[2];
    const r0 = a0*b0 + a1*b3 + a2*b6;
    const r1 = a0*b1 + a1*b4 + a2*b7;
    const r2 = a0*b2 + a1*b5 + a2*b8;

    a0 = a[3]; a1 = a[4]; a2 = a[5];
    const r3 = a0*b0 + a1*b3 + a2*b6;
    const r4 = a0*b1 + a1*b4 + a2*b7;
    const r5 = a0*b2 + a1*b5 + a2*b8;

    a0 = a[6]; a1 = a[7]; a2 = a[8];
    const r6 = a0*b0 + a1*b3 + a2*b6;
    const r7 = a0*b1 + a1*b4 + a2*b7;
    const r8 = a0*b2 + a1*b5 + a2*b8;

    return [r0, r1, r2, r3, r4, r5, r6, r7, r8];
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
  getTransformMatrix: (x, y, r, sx, offX, offY, UNIT) => {
    let m = Mat33.translate(-offX * UNIT, -offY * UNIT);
    m = Mat33.multiply(m, Mat33.scale(sx, 1));
    m = Mat33.multiply(m, Mat33.rotate(r));
    m = Mat33.multiply(m, Mat33.translate(x, y));
    return m;
  }
};

if (typeof module !== 'undefined') module.exports = { Mat33 };
