const MAGNET = 20;

function generatePts() {
    return Array.from({length: 4}, () => ({x: Math.random() * 100, y: Math.random() * 100}));
}

function runBenchmark() {
    const thisPts = generatePts();
    const otherPieces = Array.from({length: 6}, () => generatePts());

    const startOld = performance.now();
    for (let i = 0; i < 1000000; i++) {
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
    }
    const endOld = performance.now();
    console.log(`Old logic: ${endOld - startOld} ms`);

    const startNew = performance.now();
    const MAGNET_SQ = MAGNET * MAGNET;
    for (let i = 0; i < 1000000; i++) {
        let bestSq = Infinity;
        let best_dx = 0, best_dy = 0;

        // Use for loops instead of forEach for better performance
        for (let pIdx = 0; pIdx < otherPieces.length; pIdx++) {
            const otherPts = otherPieces[pIdx];
            for (let tpIdx = 0; tpIdx < thisPts.length; tpIdx++) {
                const tp = thisPts[tpIdx];
                for (let opIdx = 0; opIdx < otherPts.length; opIdx++) {
                    const op = otherPts[opIdx];
                    const dx = op.x - tp.x;
                    const dy = op.y - tp.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < MAGNET_SQ && distSq < bestSq) {
                        bestSq = distSq;
                        best_dx = dx;
                        best_dy = dy;
                    }
                }
            }
        }
    }
    const endNew = performance.now();
    console.log(`New logic: ${endNew - startNew} ms`);
}

runBenchmark();
