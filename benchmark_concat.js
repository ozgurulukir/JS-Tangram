function runStrBenchmark(maxChunks, chunkSize) {
    let chunks = "";
    const start = performance.now();
    for (let i = 0; i < maxChunks; i++) {
        const chunk = Buffer.alloc(chunkSize, 'a');
        chunks += chunk.toString();
    }
    const end = performance.now();
    return end - start;
}

function runBufBenchmark(maxChunks, chunkSize) {
    let chunks = [];
    const start = performance.now();
    for (let i = 0; i < maxChunks; i++) {
        const chunk = Buffer.alloc(chunkSize, 'a');
        chunks.push(chunk);
    }
    const result = Buffer.concat(chunks).toString('utf8');
    const end = performance.now();
    return end - start;
}

const numTrials = 20;
const chunksCount = 100000;
const chunkSize = 100; // 10MB payload

let strConcatTotalTime = 0;
let bufConcatTotalTime = 0;

for (let i = 0; i < numTrials; i++) {
    strConcatTotalTime += runStrBenchmark(chunksCount, chunkSize);
    bufConcatTotalTime += runBufBenchmark(chunksCount, chunkSize);
}

console.log(`Payload: ~10MB total in ${chunksCount} chunks of ${chunkSize} bytes each.`);
console.log(`Original (String concatenation) average time: ${(strConcatTotalTime / numTrials).toFixed(3)} ms`);
console.log(`Optimized (Buffer.concat) average time: ${(bufConcatTotalTime / numTrials).toFixed(3)} ms`);
