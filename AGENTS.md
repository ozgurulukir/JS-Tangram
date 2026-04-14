# Repository Guidelines

## Project Overview

Zen Tangram is a web-based Tangram puzzle game with a built-in level editor. Players arrange 7 geometric pieces (tans) to match target silhouettes. The UI is in Turkish. Built with vanilla JavaScript, Konva.js for Canvas rendering, Tailwind CSS for styling, and a minimal Node.js server for static file serving and level persistence.

## Architecture & Data Flow

```
Browser                          Server (server.js)
┌──────────────────┐            ┌──────────────────┐
│  tngrm.html      │  HTTP GET  │  Static files    │
│  (game UI)       │◄──────────►│  (html, js, css) │
│                  │            │                  │
│  editor.html     │  POST      │  /api/save-level │──► levels.json
│  (level editor)  │───────────►│  (auth + validate│
│                  │            │   + write queue) │
│  js/math.js      │            │                  │
│  js/constants.js │            └──────────────────┘
└──────────────────┘
```

- **No build step.** HTML files load JS/CSS directly via `<script>` and `<link>` tags. Konva.js is the sole npm dependency (loaded via CDN in HTML, not bundled).
- **`server.js`** is a standalone Node.js HTTP server (port 8080) serving static files and one API endpoint (`POST /api/save-level`) that writes validated level data to `levels.json` with file-write queuing and locking.
- **`tngrm.html`** contains the full game client: Konva stage, piece rendering, drag/drop, snap mechanics, timer, pixel-based solution validation, and notification system.
- **`editor.html`** shares game mechanics but adds level creation, navigation (prev/next), and a save workflow that POSTs to the server API.
- **`js/math.js`** provides `Mat33` (3x3 transformation matrices: identity, multiply, translate, rotate, scale, transformPoint) and `MathUtils.getClosestSnap()` for piece snapping.
- **`js/constants.js`** defines 7 tangram piece geometries as `PIECE_DEFS` (flat array) and `PIECE_DEFS_MAP` (object keyed by id for O(1) lookup). Exported via CommonJS `module.exports`.

## Key Directories

```
/                  Root — server.js, levels.json, package.json, HTML entry points
├── js/            Shared math utilities and piece definitions
│   ├── math.js    Mat33 transformation matrix + snap calculations
│   └── constants.js  PIECE_DEFS array + PIECE_DEFS_MAP lookup
├── test/          Test suite (Node.js built-in test runner)
│   ├── server.test.js       Server integration tests
│   └── validation.test.js   Unit tests for shape validation logic
├── style.css      Minimal game-specific styles
├── tngrm.html     Game UI (main entry point for players)
└── editor.html    Level editor UI
```

Benchmark files (`benchmark*.js`, `benchmark3.js`, `benchmark_getPieceVertices.js`) and `test_canvas.js` exist at root for performance testing but are not part of the standard test suite.

## Development Commands

```bash
# Install dependencies
npm install

# Start the development server (port 8080)
node server.js

# Run all tests
node --test

# Run a specific test file
node --test test/server.test.js
node --test test/validation.test.js

# Run benchmarks (ad-hoc, not part of CI)
node benchmark.js
```

There are no npm scripts defined in `package.json`. No build, lint, or format commands exist.

## Code Conventions & Common Patterns

### Module System
- **`js/constants.js`** uses CommonJS (`module.exports`).
- **`js/math.js`** uses CommonJS (`module.exports`).
- **HTML files** use `<script>` tags to load shared modules. Functions in HTML files are extracted by tests via `eval()` on file content.

### Naming
- **Files:** `snake_case.js` for JS files, lowercase for HTML/CSS.
- **Variables/Functions:** `camelCase` in JS.
- **Constants:** `UPPER_SNAKE_CASE` for top-level config (`PIECE_DEFS`, `PIECE_DEFS_MAP`, `PORT`, `MAX_BODY_SIZE`, `API_TOKEN`).
- **CSS classes:** Tailwind utility classes (no custom naming convention).
- **HTML IDs:** `kebab-case` (e.g., `game-container`, `win-overlay`).

### Error Handling
- Server uses a `logger` object with `log` (debug-only), `error` (always), and `warn` (always) methods. `DEBUG` mode is toggled via `NODE_ENV=development`.
- HTTP responses use explicit status codes: 200, 400, 403, 404, 413, 500.
- Path traversal protection rejects requests containing `..` (encoded or literal).
- API requests require `Authorization: Bearer <token>` header matching `API_TOKEN` env var (default: `admin-token`).

### Async Patterns
- **Server:** `async/await` with promise-based `fs.promises`. File writes are queued with locking to prevent race conditions on `levels.json`.
- **Frontend:** `async/await` with `AbortController` for fetch operations.

### State Management
- Game state lives in DOM/JS variables within each HTML file (no framework, no store).
- Level data is persisted server-side in `levels.json` (JSON file, read/write via server API).
- Progress tracking uses `localStorage` in the browser.

### Validation
- **Pixel-based solution checking:** Off-screen canvas renders the player's arrangement and compares against the target silhouette using Jaccard similarity (`calculateJaccardSimilarity()`).
- **Shape dimension checking:** `checkShapeDimensions()` uses tolerance-based matching.
- **Server-side:** JSON body validation, content-type enforcement, body size limit (1MB), authorization token check.

### Piece Definitions
Each piece in `PIECE_DEFS` follows this structure:
```js
{ id: 'T1', type: 'poly', pts: [x1, y1, x2, y2, ...], color: '#hex', off: [cx, cy] }
```
- `id`: Unique identifier (T1-T5 for triangles, SQ for square, PL for parallelogram)
- `pts`: Vertex coordinates as flat array [x, y, x, y, ...]
- `color`: Pastel hex color
- `off`: Center offset for rotation/scaling

## Important Files

| File | Purpose |
|---|---|
| `server.js` | HTTP server — static serving + `/api/save-level` API |
| `tngrm.html` | Main game UI — complete game client |
| `editor.html` | Level editor UI — create/save custom puzzles |
| `js/math.js` | `Mat33` transformation matrices + `MathUtils.getClosestSnap()` |
| `js/constants.js` | `PIECE_DEFS`, `PIECE_DEFS_MAP` piece definitions |
| `levels.json` | Persisted level data (solution positions/rotations/scales per piece) |
| `test/server.test.js` | Server integration tests (static files, API, security) |
| `test/validation.test.js` | Unit tests for `checkShapeDimensions` and `calculateJaccardSimilarity` |
| `package.json` | Project metadata, single dependency (`konva ^10.2.0`) |

## Runtime/Tooling Preferences

- **Runtime:** Node.js (no version pinned; tests use `node:test` which requires Node 18+)
- **Package manager:** npm
- **No build tools:** No webpack, vite, rollup, or bundler. No TypeScript.
- **No linter/formatter:** No ESLint, Prettier, or similar configured.
- **No CI/CD:** No GitHub Actions or other CI configuration.
- **Frontend framework:** None — vanilla JS with Konva.js loaded via CDN.
- **CSS framework:** Tailwind CSS (loaded via CDN in HTML files).

## Testing & QA

- **Framework:** Node.js built-in test runner (`node:test` + `node:assert`). No third-party test libraries.
- **Running tests:** `node --test` (discovers `test/*.test.js` automatically) or `node --test test/server.test.js` for a specific file.
- **Test organization:** Two test files — `server.test.js` (integration) and `validation.test.js` (unit).
- **Test technique:** Tests use `eval()` to extract functions from HTML files into test scope, then mock browser globals (`window`, `document`, `Konva`, `fetch`, `localStorage`).
- **Coverage:** No coverage tooling configured.
- **Security tests:** Path traversal protection is tested both in `server.test.js` and a standalone `test/path-traversal-test.js`.
- **Canvas tests:** Not feasible in Node.js (no native Canvas). Frontend canvas logic is tested indirectly via the pixel-comparison functions extracted from HTML.
