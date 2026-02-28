// Mock PIECE_DEFS and Math for Node context
global.PIECE_DEFS_MAP = {
  'test': {
    scaledPts: [0,0, 50,0, 50,50, 0,50],
    scaledOff: [0, 0]
  }
};

const MAGNET = 20;

function getPieceVertices(shape) {
  const def = global.PIECE_DEFS_MAP[shape.id()];
  if (!def) return [];
  const tr = shape.getTransform();
  const pts = [];
  const scaleX = shape.scaleX();

  for (let i = 0; i < def.scaledPts.length; i += 2) {
    const x = def.scaledPts[i] * scaleX;
    const y = def.scaledPts[i + 1];
    pts.push(tr.point({ x, y }));
  }
  return pts;
}

// Create a stage and some shapes
const shapes = [];
for (let i = 0; i < 7; i++) {
  const shape = {
    id: () => 'test',
    getTransform: () => ({ point: (p) => ({ x: p.x + i * 60, y: p.y + i * 60 }) }),
    scaleX: () => 1,
    getClientRect: () => ({ x: i * 60, y: i * 60, width: 50, height: 50 })
  };
  shapes.push(shape);
}

const shape = shapes[0];
const currentPieces = shapes;

function original() {
  let nearby = false;
  const thisPts = getPieceVertices(shape);

  for (let p of currentPieces) {
    if (p === shape) continue;
    const otherPts = getPieceVertices(p);
    for (let tp of thisPts) {
      for (let op of otherPts) {
        const dx = op.x - tp.x;
        const dy = op.y - tp.y;
        if (Math.sqrt(dx * dx + dy * dy) < MAGNET) {
          nearby = true;
          break;
        }
      }
      if (nearby) break;
    }
    if (nearby) break;
  }
  return nearby;
}

function optimized_fast() {
  let nearby = false;
  const thisPts = getPieceVertices(shape);
  const thisBox = shape.getClientRect();
  const expand = MAGNET;
  const minX = thisBox.x - expand;
  const maxX = thisBox.x + thisBox.width + expand;
  const minY = thisBox.y - expand;
  const maxY = thisBox.y + thisBox.height + expand;
  const magnetSq = MAGNET * MAGNET;

  for (let i = 0; i < currentPieces.length; i++) {
    const p = currentPieces[i];
    if (p === shape) continue;

    const otherBox = p.getClientRect();
    if (minX > otherBox.x + otherBox.width ||
        maxX < otherBox.x ||
        minY > otherBox.y + otherBox.height ||
        maxY < otherBox.y) {
      continue;
    }

    const otherPts = getPieceVertices(p);
    for (let j = 0; j < thisPts.length; j++) {
      const tp = thisPts[j];
      for (let k = 0; k < otherPts.length; k++) {
        const op = otherPts[k];
        const dx = op.x - tp.x;
        const dy = op.y - tp.y;
        if (dx * dx + dy * dy < magnetSq) {
          nearby = true;
          break;
        }
      }
      if (nearby) break;
    }
    if (nearby) break;
  }
  return nearby;
}

function optimized_with_getClientRect() {
  let nearby = false;
  const thisPts = getPieceVertices(shape);
  const thisBox = shape.getClientRect();
  const expand = MAGNET;
  const minX = thisBox.x - expand;
  const maxX = thisBox.x + thisBox.width + expand;
  const minY = thisBox.y - expand;
  const maxY = thisBox.y + thisBox.height + expand;

  for (let p of currentPieces) {
    if (p === shape) continue;

    const otherBox = p.getClientRect();
    if (minX > otherBox.x + otherBox.width ||
        maxX < otherBox.x ||
        minY > otherBox.y + otherBox.height ||
        maxY < otherBox.y) {
      continue;
    }

    const otherPts = getPieceVertices(p);
    for (let tp of thisPts) {
      for (let op of otherPts) {
        const dx = op.x - tp.x;
        const dy = op.y - tp.y;
        if (dx * dx + dy * dy < MAGNET * MAGNET) {
          nearby = true;
          break;
        }
      }
      if (nearby) break;
    }
    if (nearby) break;
  }
  return nearby;
}

function optimized_with_manual_aabb() {
  let nearby = false;
  const thisPts = getPieceVertices(shape);

  let thisMinX = Infinity, thisMinY = Infinity, thisMaxX = -Infinity, thisMaxY = -Infinity;
  for (let i = 0; i < thisPts.length; i++) {
    const pt = thisPts[i];
    if (pt.x < thisMinX) thisMinX = pt.x;
    if (pt.x > thisMaxX) thisMaxX = pt.x;
    if (pt.y < thisMinY) thisMinY = pt.y;
    if (pt.y > thisMaxY) thisMaxY = pt.y;
  }
  thisMinX -= MAGNET;
  thisMaxX += MAGNET;
  thisMinY -= MAGNET;
  thisMaxY += MAGNET;
  const magnetSq = MAGNET * MAGNET;

  for (let p of currentPieces) {
    if (p === shape) continue;

    const otherPts = getPieceVertices(p);
    let otherMinX = Infinity, otherMinY = Infinity, otherMaxX = -Infinity, otherMaxY = -Infinity;
    for (let i = 0; i < otherPts.length; i++) {
      const pt = otherPts[i];
      if (pt.x < otherMinX) otherMinX = pt.x;
      if (pt.x > otherMaxX) otherMaxX = pt.x;
      if (pt.y < otherMinY) otherMinY = pt.y;
      if (pt.y > otherMaxY) otherMaxY = pt.y;
    }

    if (thisMinX > otherMaxX || thisMaxX < otherMinX || thisMinY > otherMaxY || thisMaxY < otherMinY) {
      continue;
    }

    for (let tp of thisPts) {
      for (let op of otherPts) {
        const dx = op.x - tp.x;
        const dy = op.y - tp.y;
        if (dx * dx + dy * dy < magnetSq) {
          nearby = true;
          break;
        }
      }
      if (nearby) break;
    }
    if (nearby) break;
  }
  return nearby;
}

const N = 1000000;

console.time('original');
for (let i=0; i<N; i++) original();
console.timeEnd('original');

console.time('optimized_with_getClientRect');
for (let i=0; i<N; i++) optimized_with_getClientRect();
console.timeEnd('optimized_with_getClientRect');

console.time('optimized_with_manual_aabb');
for (let i=0; i<N; i++) optimized_with_manual_aabb();
console.timeEnd('optimized_with_manual_aabb');

console.time('optimized_fast');
for (let i=0; i<N; i++) optimized_fast();
console.timeEnd('optimized_fast');
