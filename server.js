// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Ozgur Ulukir
const http = require('http');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const PORT = 8080;
const MAX_BODY_SIZE = 1024 * 1024; // 1MB
const DEBUG = process.env.NODE_ENV === 'development';

// Logger utility - suppresses logs in production
const logger = {
  log: (...args) => {
    if (DEBUG) {
      console.log(...args);
    }
  },
  error: (...args) => {
    // Always log errors
    console.error(...args);
  },
  warn: (...args) => {
    // Always log warnings
    console.warn(...args);
  }
};

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// File lock to prevent race conditions
let fileWriteLock = false;
const writeQueue = [];

async function processWriteQueue() {
  if (fileWriteLock || writeQueue.length === 0) return;
  
  fileWriteLock = true;
  const { res, levelData } = writeQueue.shift();
  
  try {
    const levelsPath = path.join(__dirname, 'levels.json');
    
    // Read current levels
    let levels = [];
    try {
      const data = await fsPromises.readFile(levelsPath, 'utf8');
      if (data) {
        levels = JSON.parse(data);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        logger.error('Error reading levels.json:', err);
      }
    }
    
    // Check if level with same name exists, update it, otherwise add new
    const existingIndex = levels.findIndex(l => l.name === levelData.name);
    if (existingIndex >= 0) {
      levels[existingIndex] = levelData;
    } else {
      levels.push(levelData);
    }
    
    // Write updated levels
    await fsPromises.writeFile(levelsPath, JSON.stringify(levels, null, 2), 'utf8');
    
    if (!res.headersSent) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Level saved' }));
    }
  } catch (err) {
    logger.error('Error saving level:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to save level', details: err.message }));
    }
  } finally {
    fileWriteLock = false;
    processWriteQueue(); // Process next in queue
  }
}

function queueLevelWrite(res, levelData) {
  writeQueue.push({ res, levelData });
  processWriteQueue();
}

const server = http.createServer((req, res) => {
  logger.log(`${req.method} ${req.url}`);

  // Handle API requests
  if (req.url === '/api/save-level' && req.method === 'POST') {
    let body = '';
    let bodySize = 0;
    let tooLarge = false;
    
    req.on('data', chunk => {
      if (tooLarge) return;
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_SIZE) {
        tooLarge = true;
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    
    req.on('end', () => {
      if (tooLarge) return;
      
      try {
        const newLevel = JSON.parse(body);
        
        // Validate required fields
        if (!newLevel.name || !newLevel.sol) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid level data: missing name or solution' }));
          return;
        }
        
        // Queue the write operation to prevent race conditions
        queueLevelWrite(res, newLevel);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON', details: e.message }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './tngrm.html';
  }

  // Security: Normalize path and prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  const rootDir = path.resolve(__dirname);
  const resolvedPath = path.resolve(normalizedPath);
  
  // Ensure the resolved path is within the project root
  if (!resolvedPath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Access denied');
    return;
  }
  
  filePath = resolvedPath;

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
