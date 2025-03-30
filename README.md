# Rubik's Cube

A modern 3D Rubik's Cube implementation using Next.js, Three.js, and React Three Fiber.

## Features

- Interactive 3D Rubik's Cube with smooth animations
- Modern Gumroad-style UI design
- Advanced face selection and rotation:
  - Visual feedback with glowing effects and face separation
  - Continuous rotation mode for selected faces
  - Intuitive keyboard and mouse controls
- Move history tracking
- Auto-solve functionality
- Beginner's guide with step-by-step instructions

## Tech Stack

- Next.js 14
- TypeScript
- Three.js with React Three Fiber
- Tailwind CSS
- Zustand for state management

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/terpjwu1/rubikscube.git
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Controls

### Face Selection and Rotation
- Click a face button or use keyboard keys (F, B, R, L, U, D) to select a face
- When a face is selected:
  - Use Left/Right arrow keys for counter-clockwise/clockwise rotation
  - Click rotation buttons for precise control
  - Press the same face key again to rotate (hold Shift for counter-clockwise)
  - Press Space to exit selection mode

### Other Controls
- Press Z to undo moves
- Press ESC to reset the cube
- Click Auto Solve for automatic solution
- Click Scramble for a random shuffle
