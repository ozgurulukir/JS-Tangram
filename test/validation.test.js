const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Read the HTML file and extract the functions
const htmlPath = path.join(__dirname, '../tngrm.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// We use eval to extract the functions out of the HTML string into our test scope.
// We must provide mocks for globals that the script tries to access when evaluated.
const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
const scriptContent = scriptMatch[1];

// Mock dependencies
const mockWindow = {
  addEventListener: () => {},
  onload: null,
};

const mockDocument = {
  getElementById: () => ({
    style: {},
    classList: { add: () => {}, remove: () => {} },
    getContext: () => ({}),
  }),
  body: { style: {}, appendChild: () => {} },
  createElement: () => ({
    style: {},
    getContext: () => ({}),
  }),
  addEventListener: () => {},
  removeEventListener: () => {},
};

const mockKonva = {
  Stage: class {
    on() {}
    add() {}
    width() {}
    height() {}
    scale() {}
    draw() {}
  },
  Layer: class {
    add() {}
    destroyChildren() {}
    draw() {}
  },
  Line: class {
    on() {}
    moveToTop() {}
    shadowOpacity() { return this; }
    shadowOffset() { return this; }
    stroke() {}
    strokeWidth() {}
    getTransform() {
      return {
        point: (p) => p
      };
    }
    scaleX() { return 1; }
    id() { return 'mock'; }
  },
  Group: class {
    add() {}
    getClientRect() { return { width: 10, height: 10, x: 0, y: 0 }; }
    scale() {}
    position() {}
    x() { return 0; }
    y() { return 0; }
  },
  Animation: class {
    start() {}
    stop() {}
  },
  Easings: {
    EaseInOut: 'EaseInOut'
  }
};

const mockFetch = async () => ({
  ok: true,
  json: async () => ([])
});

// Setup global mocks
global.window = mockWindow;
global.document = mockDocument;
global.Konva = mockKonva;
global.fetch = mockFetch;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Expose the necessary functions globally for eval
let checkShapeDimensions, calculateJaccardSimilarity;

const mockedScriptContent = scriptContent.replace(
  'function checkShapeDimensions',
  'global.checkShapeDimensions = function checkShapeDimensions'
).replace(
  'function calculateJaccardSimilarity',
  'global.calculateJaccardSimilarity = function calculateJaccardSimilarity'
);

const { PIECE_DEFS, PIECE_DEFS_MAP } = require('../js/constants.js');
const { Mat33 } = require('../js/math.js');

global.PIECE_DEFS = PIECE_DEFS;
global.PIECE_DEFS_MAP = PIECE_DEFS_MAP;
global.Mat33 = Mat33;

// Evaluate the script content
eval(mockedScriptContent);

checkShapeDimensions = global.checkShapeDimensions;
calculateJaccardSimilarity = global.calculateJaccardSimilarity;

// Tests
test('Validation Logic', async (t) => {
  await t.test('checkShapeDimensions', async (t2) => {
    await t2.test('returns true for exact match', () => {
      const result = checkShapeDimensions(100, 100, 100, 100, 0.15);
      assert.strictEqual(result, true);
    });

    await t2.test('returns true within positive tolerance', () => {
      // Target: 100, Current: 110. Tolerance: 0.15 * 100 = 15. Diff = 10 <= 15
      const result = checkShapeDimensions(100, 100, 110, 110, 0.15);
      assert.strictEqual(result, true);
    });

    await t2.test('returns true within negative tolerance', () => {
      // Target: 100, Current: 90. Diff = 10 <= 15
      const result = checkShapeDimensions(100, 100, 90, 90, 0.15);
      assert.strictEqual(result, true);
    });

    await t2.test('returns false if width difference is exactly above tolerance', () => {
      // Target: 100, Current: 116. Diff = 16 > 15
      const result = checkShapeDimensions(100, 100, 116, 100, 0.15);
      assert.strictEqual(result, false);
    });

    await t2.test('returns false if height difference is above tolerance', () => {
      // Target: 100, Current: 84. Diff = 16 > 15
      const result = checkShapeDimensions(100, 100, 100, 84, 0.15);
      assert.strictEqual(result, false);
    });
  });

  await t.test('calculateJaccardSimilarity', async (t2) => {
    // Helper to generate mock image data
    // imgData is usually [r, g, b, a, r, g, b, a, ...]
    const generateImgData = (pixels) => {
      const data = new Uint8ClampedArray(pixels.length * 4);
      for (let i = 0; i < pixels.length; i++) {
        data[i * 4] = 0;     // R
        data[i * 4 + 1] = 0; // G
        data[i * 4 + 2] = 0; // B
        data[i * 4 + 3] = pixels[i]; // A
      }
      return data;
    };

    await t2.test('returns 1.0 for completely identical non-empty shapes', () => {
      const data1 = generateImgData([255, 255, 0, 0]); // 2 pixels filled
      const data2 = generateImgData([255, 255, 0, 0]); // Same 2 pixels filled
      const similarity = calculateJaccardSimilarity(data1, data2);
      assert.strictEqual(similarity, 1.0);
    });

    await t2.test('returns 0.0 for completely disjoint shapes', () => {
      const data1 = generateImgData([255, 255, 0, 0]);
      const data2 = generateImgData([0, 0, 255, 255]);
      const similarity = calculateJaccardSimilarity(data1, data2);
      assert.strictEqual(similarity, 0.0);
    });

    await t2.test('calculates correct partial similarity (50%)', () => {
      // shape 1 has pixels at idx 0, 1
      const data1 = generateImgData([255, 255, 0, 0]);
      // shape 2 has pixels at idx 1, 2
      const data2 = generateImgData([0, 255, 255, 0]);

      // union pixels: idx 0, 1, 2 = 3 pixels
      // intersection pixels: idx 1 = 1 pixel
      // similarity = 1/3 ~ 0.333
      const similarity = calculateJaccardSimilarity(data1, data2);
      assert.ok(Math.abs(similarity - (1/3)) < 0.0001, `Expected ~0.333, got ${similarity}`);
    });

    await t2.test('handles threshold for alpha channel (>128)', () => {
      const data1 = generateImgData([129, 0]); // > 128 (is filled)
      const data2 = generateImgData([128, 0]); // <= 128 (is not filled)

      // union: pixel 0 (from data1)
      // intersection: 0
      const similarity = calculateJaccardSimilarity(data1, data2);
      assert.strictEqual(similarity, 0.0);
    });

    await t2.test('returns 0 for empty shapes (both union and intersection are 0)', () => {
      const data1 = generateImgData([0, 0, 0, 0]);
      const data2 = generateImgData([0, 0, 0, 0]);
      const similarity = calculateJaccardSimilarity(data1, data2);
      assert.strictEqual(similarity, 0.0);
    });
  });
});
