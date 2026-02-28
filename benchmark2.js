const { PIECE_DEFS, PIECE_DEFS_MAP } = require('./js/constants.js');
const { Mat33 } = require('./js/math.js');

const UNIT = 36;
const iterations = 2000000;

const config = { x: 100, y: 100, r: 90, sx: 1 };
const def = PIECE_DEFS_MAP['T1'];

// Baseline
function baseline() {
  const matrix = Mat33.getTransformMatrix(
    config.x, config.y, config.r, config.sx,
    def.off[0], def.off[1], UNIT
  );

  const poly = [];
  for(let i=0; i<def.pts.length; i+=2) {
    const pt = Mat33.point(matrix, { x: def.pts[i] * UNIT, y: def.pts[i+1] * UNIT });
    poly.push(pt);
  }
  return poly;
}

// Pre-calculated
def.scaledPts = def.pts.map(p => p * UNIT);
def.scaledOff = [def.off[0] * UNIT, def.off[1] * UNIT];

function optimized() {
  const matrix = Mat33.getTransformMatrix(
    config.x, config.y, config.r, config.sx,
    def.scaledOff[0], def.scaledOff[1], 1
  );

  const poly = [];
  for(let i=0; i<def.scaledPts.length; i+=2) {
    const pt = Mat33.point(matrix, { x: def.scaledPts[i], y: def.scaledPts[i+1] });
    poly.push(pt);
  }
  return poly;
}

// Warmup
for(let i=0; i<10000; i++) {
  baseline();
  optimized();
}

const start1 = performance.now();
for(let i=0; i<iterations; i++) {
  baseline();
}
const end1 = performance.now();
const time1 = end1 - start1;

const start2 = performance.now();
for(let i=0; i<iterations; i++) {
  optimized();
}
const end2 = performance.now();
const time2 = end2 - start2;

console.log(`Baseline: ${time1.toFixed(2)}ms`);
console.log(`Optimized: ${time2.toFixed(2)}ms`);
console.log(`Improvement: ${(time1 / time2).toFixed(2)}x faster`);
