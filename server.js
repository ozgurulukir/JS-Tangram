// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Ozgur Ulukir
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle API requests
  if (req.url === '/api/save-level' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const newLevel = JSON.parse(body);
        const levelsPath = path.join(__dirname, 'levels.json');
        
        fs.readFile(levelsPath, 'utf8', (err, data) => {
          let levels = [];
          if (!err && data) {
            try {
              levels = JSON.parse(data);
            } catch (e) {
              console.error('Error parsing levels.json:', e);
            }
          }

          // Check if level with same name exists, update it, otherwise add new
          const existingIndex = levels.findIndex(l => l.name === newLevel.name);
          if (existingIndex >= 0) {
            levels[existingIndex] = newLevel;
          } else {
            levels.push(newLevel);
          }

          fs.writeFile(levelsPath, JSON.stringify(levels, null, 2), (err) => {
            if (err) {
              console.error('Error writing file:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to save level' }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Level saved' }));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './tngrm.html';
  }

  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running at http://127.0.0.1:${PORT}/`);
  });
}

module.exports = server;
