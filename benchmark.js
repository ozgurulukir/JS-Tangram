const MAGNET = 20;

function generatePts(count) {
    const pts = [];
    for (let i=0; i<count; i++) {
        pts.push({x: Math.random() * 500, y: Math.random() * 500});
    }
    return pts;
}

const thisPts = generatePts(4);
const otherPieces = [];
for(let i=0; i<6; i++) {
    otherPieces.push(generatePts(4));
}

function original() {
    let best = { dist: Infinity, dx: 0, dy: 0 };
    otherPieces.forEach(otherPts => {
        thisPts.forEach(tp => {
            otherPts.forEach(op => {
                const dx = op.x - tp.x;
                const dy = op.y - tp.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAGNET && dist < best.dist) {
                    best = { dist, dx, dy };
                }
            });
        });
    });
    return best;
}

function optimized() {
    let best = { distSq: Infinity, dx: 0, dy: 0 };
    const magnetSq = MAGNET * MAGNET;
    otherPieces.forEach(otherPts => {
        thisPts.forEach(tp => {
            otherPts.forEach(op => {
                const dx = op.x - tp.x;
                const dy = op.y - tp.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < magnetSq && distSq < best.distSq) {
                    best = { distSq, dx, dy };
                }
            });
        });
    });
    return best;
}

const N = 1000000;
let start = performance.now();
for(let i=0; i<N; i++) original();
let end = performance.now();
console.log("Original: " + (end - start) + " ms");

start = performance.now();
for(let i=0; i<N; i++) optimized();
end = performance.now();
console.log("Optimized: " + (end - start) + " ms");
