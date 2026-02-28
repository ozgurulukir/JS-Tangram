const { chromium } = require('playwright');

async function runBenchmark() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to local server...');
  await page.goto('http://127.0.0.1:8080/tngrm.html', { waitUntil: 'load', timeout: 30000 }).catch(e => console.log('goto error:', e));

  console.log('Page loaded, running setup...');
  await page.evaluate(() => {
    window.PUZZLES = [{
      name: "Test",
      sol: {
        "T1": { x: 100, y: 100, r: 0, sx: 1 },
        "T2": { x: 150, y: 150, r: 90, sx: 1 }
      }
    }];
    window.puzzleIndex = 0;
  });

  console.log('Running benchmark...');
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

  console.log(`\nBenchmark Results:`);
  console.log(`Iterations: ${results.iterations}`);
  console.log(`Total Time: ${results.timeMs.toFixed(2)} ms`);
  console.log(`Average Time per Call: ${results.avgMs.toFixed(4)} ms\n`);

  await browser.close();
}

runBenchmark().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
