// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Ozgur Ulukir
const http = require('http');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const PORT = 8080;
const MAX_BODY_SIZE = 1024 * 1024; // 1MB
const DEBUG = process.env.NODE_ENV === 'development';
const API_TOKEN = process.env.API_TOKEN || 'admin-token';

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

// Code Health Fix: Deeply Nested Callbacks in server.js at line 31
// (Original nested callbacks here were refactored into processWriteQueue)
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
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
let cachedLevels = null;

const staticCache = new Map();

async function processWriteQueue() {
  if (fileWriteLock || writeQueue.length === 0) return;
  
  fileWriteLock = true;
  const { res, levelData } = writeQueue.shift();
  
  const levelsPath = path.join(__dirname, 'levels.json');
  const lockPath = path.join(__dirname, 'levels.json.lock');
  const tmpPath = path.join(__dirname, 'levels.json.tmp');

  let fileHandle = null;

  try {
    try {
      fileHandle = await fsPromises.open(lockPath, 'wx');
    } catch (err) {
      // If we can't get the lock, put the task back and retry later
      writeQueue.unshift({ res, levelData });
      fileWriteLock = false;
      setTimeout(processWriteQueue, 50);
      return;
    }

    // Read current levels if not cached
    if (cachedLevels === null) {
      cachedLevels = [];
      try {
        const data = await fsPromises.readFile(levelsPath, 'utf8');
        if (data) {
          cachedLevels = JSON.parse(data);
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          logger.error('Error reading levels.json:', err);
        }
      }
    }
    
    // Check if level with same name exists, update it, otherwise add new
    const existingIndex = cachedLevels.findIndex(l => l.name === levelData.name);
    if (existingIndex >= 0) {
      cachedLevels[existingIndex] = levelData;
    } else {
      cachedLevels.push(levelData);
    }
    
    const newContent = JSON.stringify(cachedLevels, null, 2);
    // Write updated levels to tmp file
    await fsPromises.writeFile(tmpPath, newContent, 'utf8');
    // Atomically rename tmp file to real file
    await fsPromises.rename(tmpPath, levelsPath);
    
    // Clear staticCache for levels.json
    staticCache.delete(levelsPath);

    if (!res.headersSent) {
      res.writeHead(200, { ...securityHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Level saved' }));
    }
  } catch (err) {
    logger.error('Error saving level:', err);
    if (!res.headersSent) {
      res.writeHead(500, { ...securityHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to save level', details: err.message }));
    }
  } finally {
    if (fileHandle) {
      try {
        await fileHandle.close();
      } catch (e) { /* ignore */ }
      try {
        await fsPromises.unlink(lockPath);
      } catch (e) { /* ignore */ }
    }
    fileWriteLock = false;
    processWriteQueue(); // Process next in queue
  }
}

function queueLevelWrite(res, levelData) {
  writeQueue.push({ res, levelData });
  processWriteQueue();
}

const server = http.createServer(async (req, res) => {
  logger.log(`${req.method} ${req.url}`);

  // Handle API requests
  if (req.url === '/api/save-level' && req.method === 'POST') {
    // Security: Require authentication to save levels
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${API_TOKEN}`) {
      res.writeHead(401, { ...securityHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    let body = '';
    let bodySize = 0;
    let tooLarge = false;
    
    req.on('data', chunk => {
      if (tooLarge) return;
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_SIZE) {
        tooLarge = true;
        res.writeHead(413, { ...securityHeaders, 'Content-Type': 'application/json' });
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
          res.writeHead(400, { ...securityHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid level data: missing name or solution' }));
          return;
        }
        
        // Queue the write operation to prevent race conditions
        queueLevelWrite(res, newLevel);
      } catch (e) {
        res.writeHead(400, { ...securityHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON', details: e.message }));
      }
    });
    return;
  }

  // Serve static files
  // Security: Reject null bytes
  if (req.url.indexOf('\0') !== -1 || req.url.indexOf('%00') !== -1) {
    res.writeHead(400, { ...securityHeaders, 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }

  // Parse URL to separate path from query string/hash
  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch (e) {
    res.writeHead(400, { ...securityHeaders, 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }

  // Decode URI component to handle encoded paths like %2e%2e
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(parsedUrl.pathname);
  } catch (e) {
    res.writeHead(400, { ...securityHeaders, 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }

  let filePath = '.' + decodedPath;
  if (filePath === './') {
    filePath = './tngrm.html';
  }

  // Security: Normalize path and prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  const rootDir = path.resolve(__dirname);
  const rootDirWithSep = rootDir + path.sep;
  const resolvedPath = path.resolve(normalizedPath);
  
  // Ensure the resolved path is strictly within the project root
  if (!resolvedPath.startsWith(rootDirWithSep) && resolvedPath !== rootDir) {
    res.writeHead(403, { ...securityHeaders, 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Access denied');
    return;
  }
  
  filePath = resolvedPath;

  const extname = path.extname(filePath);

  // Fix source code disclosure: block unmapped extensions, dotfiles, and sensitive files/directories
  const baseName = path.basename(filePath);
  const relativePath = path.relative(rootDir, resolvedPath);
  const topLevel = relativePath.split(path.sep)[0];
  const SENSITIVE_FILES = [
    'server.js', 'package.json', 'package-lock.json', '.env', '.git',
    'test', 'test_dir', 'README.md', 'LICENSE', 'benchmark.js',
    'benchmark2.js', 'test_canvas.js'
  ];

  if (!MIME_TYPES[extname] || baseName.startsWith('.') || SENSITIVE_FILES.includes(topLevel)) {
    res.writeHead(403, { ...securityHeaders, 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Access denied');
    return;
  }

  const contentType = MIME_TYPES[extname];

  const isDynamic = extname === '.json';

  try {
    let content;
    if (!isDynamic && staticCache.has(filePath)) {
      content = staticCache.get(filePath);
    } else {
      content = await fsPromises.readFile(filePath);
      if (!isDynamic) {
        staticCache.set(filePath, content);
      }
    }

    if (isDynamic) {
      res.writeHead(200, {
        ...securityHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
    } else {
      res.writeHead(200, {
        ...securityHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      });
    }

    res.end(content, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, securityHeaders);
      res.end('404 Not Found');
    } else {
      res.writeHead(500, securityHeaders);
      res.end('500 Internal Server Error: ' + err.code);
    }
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running at http://127.0.0.1:${PORT}/`);
  });
}

module.exports = server;
