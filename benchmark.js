const http = require('http');

const runBenchmark = async () => {
  const NUM_REQUESTS = 10000;
  let completed = 0;
  const start = process.hrtime.bigint();

  const makeRequest = () => {
    return new Promise((resolve) => {
      http.get('http://127.0.0.1:8080/tngrm.html', (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          completed++;
          resolve();
        });
      }).on('error', (err) => {
        console.error('Request error:', err);
        completed++;
        resolve();
      });
    });
  };

  // Run with concurrency
  const CONCURRENCY = 100;

  let currentIndex = 0;

  const worker = async () => {
    while (currentIndex < NUM_REQUESTS) {
      currentIndex++;
      await makeRequest();
    }
  };

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;
  const reqPerSec = (NUM_REQUESTS / durationMs) * 1000;

  console.log(`Completed ${NUM_REQUESTS} requests in ${durationMs.toFixed(2)} ms`);
  console.log(`Requests per second: ${reqPerSec.toFixed(2)} req/sec`);
};

runBenchmark().catch(console.error);
