const { chromium } = require('playwright');
const path = require('path');

async function runBenchmark() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const filePath = `file://${path.resolve(__dirname, '../tngrm.html')}`;
  console.log('Navigating to', filePath);
  await page.goto(filePath, { waitUntil: 'load' });

  console.log('Page loaded, evaluating setup');
  await page.evaluate(() => {
    // Inject mock data
    window.PUZZLES = [{
      name: "Test",
      sol: {
        "T1": { x: 100, y: 100, r: 0, sx: 1 },
        "T2": { x: 150, y: 150, r: 90, sx: 1 }
      }
    }];
    window.puzzleIndex = 0;
  });

  console.log('Running benchmark');
  const results = await page.evaluate(() => {
    const iterations = 500;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      window.checkSolution();
    }
    const end = performance.now();
    return {
      iterations,
      timeMs: end - start,
      avgMs: (end - start) / iterations
    };
  });

  console.log(`Benchmark Results:`);
  console.log(`Iterations: ${results.iterations}`);
  console.log(`Total Time: ${results.timeMs.toFixed(2)} ms`);
  console.log(`Average Time per Call: ${results.avgMs.toFixed(4)} ms`);

  await browser.close();
}

runBenchmark().catch(console.error);