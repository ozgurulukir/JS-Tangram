const PIECE_DEFS = [
  // Big Triangles (Area 4)
  { id: 'T1', type: 'poly', pts: [0, 0, 4, 0, 2, 2], color: '#fca5a5', off: [2, 1] }, // Pastel Red/Pink
  { id: 'T2', type: 'poly', pts: [0, 0, 4, 0, 2, 2], color: '#fdba74', off: [2, 1] }, // Pastel Orange
  // Medium Triangle (Area 2)
  { id: 'T3', type: 'poly', pts: [0, 0, 2, 0, 0, 2], color: '#86efac', off: [0.67, 0.67] }, // Pastel Green
  // Small Triangles (Area 1)
  { id: 'T4', type: 'poly', pts: [0, 0, 2, 0, 1, 1], color: '#c4b5fd', off: [1, 0.5] }, // Pastel Purple
  { id: 'T5', type: 'poly', pts: [0, 0, 2, 0, 1, 1], color: '#93c5fd', off: [1, 0.5] }, // Pastel Blue
  // Square (Area 2)
  { id: 'SQ', type: 'poly', pts: [1, 0, 2, 1, 1, 2, 0, 1], color: '#fde047', off: [1, 1] }, // Pastel Yellow
  // Parallelogram (Area 2)
  { id: 'PL', type: 'poly', pts: [0, 0, 2, 0, 3, 1, 1, 1], color: '#67e8f9', off: [1.5, 0.5] } // Pastel Cyan
];

if (typeof module !== 'undefined') module.exports = { PIECE_DEFS };
