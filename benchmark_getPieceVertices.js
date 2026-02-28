const { PIECE_DEFS, PIECE_DEFS_MAP } = require('./js/constants.js');

function testFind(id) {
    return PIECE_DEFS.find(d => d.id === id);
}

function testMap(id) {
    return PIECE_DEFS_MAP[id];
}

const iterations = 10000000;
const testIds = ['T1', 'T2', 'T3', 'T4', 'T5', 'SQ', 'PL'];

// Warmup
for (let i = 0; i < 10000; i++) {
    const id = testIds[i % testIds.length];
    testFind(id);
    testMap(id);
}

console.log(`Running ${iterations} iterations...`);

let sum1 = 0;
let startFind = performance.now();
for (let i = 0; i < iterations; i++) {
    const id = testIds[i % testIds.length];
    if (testFind(id)) sum1++;
}
let endFind = performance.now();
console.log(`Array.find(): ${(endFind - startFind).toFixed(2)} ms`);

let sum2 = 0;
let startMap = performance.now();
for (let i = 0; i < iterations; i++) {
    const id = testIds[i % testIds.length];
    if (testMap(id)) sum2++;
}
let endMap = performance.now();
console.log(`Object Map: ${(endMap - startMap).toFixed(2)} ms`);
console.log(`Improvement: ${((endFind - startFind) / (endMap - startMap)).toFixed(2)}x faster`);
// Output sum so JIT doesnt optimize away
console.log(sum1, sum2);
