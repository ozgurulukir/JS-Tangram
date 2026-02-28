# Zen Tangram [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A relaxing, web-based implementation of the classic Tangram puzzle game, featuring a built-in level editor. Playable in Turkish.

## 🎮 Gameplay

**Objective:** Arrange all 7 pieces (tans) to perfectly match the target silhouette without overlapping.

### Controls
- **Drag & Drop:** Move pieces around the board.
- **Rotate:** Double-click (or double-tap) a piece to rotate it by 45°.
- **Flip:** Select the parallelogram and click the "Flip Piece" button (or press `F`).
- **Precision Move:** Use **WASD** or **Arrow Keys** to nudge the selected piece.
- **Selection:** Click a piece to select/deselect it. Click the background to deselect.

### Features
- **Smart Snapping:** Pieces snap to each other and the grid for clean alignment.
- **Level Editor:** Create your own puzzles and save them permanently to the game.
- **Progress Tracking:** Automatically saves your last played level.
- **Timer:** Challenge yourself to solve puzzles faster.

---

## 💻 Tech Stack & Coding

This project is built with vanilla web technologies, keeping it lightweight and fast.

- **Frontend:**
  - **HTML5 Canvas:** Powered by [Konva.js](https://konvajs.org/) for high-performance 2D rendering and drag-and-drop interactions.
  - **Tailwind CSS:** Used for modern, responsive UI styling.
  - **Matrix Math:** Custom 3x3 matrix implementation for precise shape transformations (rotation, scaling, translation).
  - **Pixel-Based Verification:** Robust solution checking that compares the silhouette of your arrangement against the target using off-screen canvas rendering.

- **Backend:**
  - **Node.js:** A simple `server.js` handles static file serving and provides an API endpoint (`/api/save-level`) to write new levels to `levels.json`.

---

## 🚀 How to Run

1. **Prerequisites:** Ensure you have [Node.js](https://nodejs.org/) installed.

2. **Start the Server:**
   Open a terminal in the project folder and run:
   ```bash
   node server.js
   ```
   *(This starts a local server on port 8080)*

3. **Play:**
   Open your browser and navigate to:
   - **Game:** [http://localhost:8080/tngrm.html](http://localhost:8080/tngrm.html)
   - **Editor:** [http://localhost:8080/editor.html](http://localhost:8080/editor.html)

---

## License
MIT License. See [LICENSE](LICENSE) for details.
