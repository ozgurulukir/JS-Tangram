const http = require('http');

const url = 'http://127.0.0.1:8080/tngrm.html';
const totalRequests = 5000;
let completedRequests = 0;

const start = Date.now();

for (let i = 0; i < totalRequests; i++) {
  http.get(url, (res) => {
    res.on('data', () => {});
    res.on('end', () => {
      completedRequests++;
      if (completedRequests === totalRequests) {
        const duration = Date.now() - start;
        console.log(`Completed ${totalRequests} requests in ${duration}ms`);
        console.log(`Requests per second: ${((totalRequests / duration) * 1000).toFixed(2)}`);
      }
    });
  }).on('error', (err) => {
    console.error('Error:', err.message);
  });
}
