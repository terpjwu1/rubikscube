import { create } from 'zustand';

export type Color = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green' | 'black';

export interface CubePiece {
  position: [number, number, number];
  rotation: [number, number, number];
  colors: {
    front: Color;
    back: Color;
    top: Color;
    bottom: Color;
    left: Color;
    right: Color;
  };
}

interface CubeState {
  pieces: CubePiece[];
  moves: string[];
  isAnimating: boolean;
  currentRotation: string | null;
  isSolving: boolean;
  initializeCube: () => void;
  rotateFace: (face: string) => void;
  undoMove: () => void;
  resetCube: () => void;
  autoSolve: () => void;
}

// Helper function to create initial cube state
const createInitialCubeState = (): CubePiece[] => {
  const pieces: CubePiece[] = [];
  
  // Generate all 27 pieces (3x3x3)
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        pieces.push({
          position: [x, y, z],
          rotation: [0, 0, 0],
          colors: {
            front: z === 1 ? 'green' : 'black',
            back: z === -1 ? 'blue' : 'black',
            top: y === 1 ? 'white' : 'black',
            bottom: y === -1 ? 'yellow' : 'black',
            left: x === -1 ? 'orange' : 'black',
            right: x === 1 ? 'red' : 'black',
          },
        });
      }
    }
  }
  
  return pieces;
};

// Helper function to rotate pieces around an axis
const rotatePiecesAroundAxis = (pieces: CubePiece[], axis: 'x' | 'y' | 'z', layer: number, clockwise: boolean): CubePiece[] => {
  return pieces.map(piece => {
    const [x, y, z] = piece.position;
    
    // Only rotate pieces in the specified layer
    if (axis === 'x' && x === layer) {
      const newY = clockwise ? z : -z;
      const newZ = clockwise ? -y : y;
      return {
        ...piece,
        position: [x, newY, newZ],
        colors: {
          ...piece.colors,
          top: clockwise ? piece.colors.front : piece.colors.back,
          bottom: clockwise ? piece.colors.back : piece.colors.front,
          front: clockwise ? piece.colors.bottom : piece.colors.top,
          back: clockwise ? piece.colors.top : piece.colors.bottom,
        },
      };
    } else if (axis === 'y' && y === layer) {
      const newX = clockwise ? -z : z;
      const newZ = clockwise ? x : -x;
      return {
        ...piece,
        position: [newX, y, newZ],
        colors: {
          ...piece.colors,
          front: clockwise ? piece.colors.right : piece.colors.left,
          back: clockwise ? piece.colors.left : piece.colors.right,
          left: clockwise ? piece.colors.front : piece.colors.back,
          right: clockwise ? piece.colors.back : piece.colors.front,
        },
      };
    } else if (axis === 'z' && z === layer) {
      const newX = clockwise ? y : -y;
      const newY = clockwise ? -x : x;
      return {
        ...piece,
        position: [newX, newY, z],
        colors: {
          ...piece.colors,
          top: clockwise ? piece.colors.left : piece.colors.right,
          bottom: clockwise ? piece.colors.right : piece.colors.left,
          left: clockwise ? piece.colors.bottom : piece.colors.top,
          right: clockwise ? piece.colors.top : piece.colors.bottom,
        },
      };
    }
    return piece;
  });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useCubeStore = create<CubeState>((set, get) => ({
  pieces: [],
  moves: [],
  isAnimating: false,
  currentRotation: null,
  isSolving: false,
  
  initializeCube: () => {
    set({ pieces: createInitialCubeState() });
  },
  
  rotateFace: (face) => {
    set((state) => {
      let newPieces = [...state.pieces];
      
      switch (face) {
        case 'F':
          newPieces = rotatePiecesAroundAxis(newPieces, 'z', 1, true);
          break;
        case 'F\'':
          newPieces = rotatePiecesAroundAxis(newPieces, 'z', 1, false);
          break;
        case 'B':
          newPieces = rotatePiecesAroundAxis(newPieces, 'z', -1, false);
          break;
        case 'B\'':
          newPieces = rotatePiecesAroundAxis(newPieces, 'z', -1, true);
          break;
        case 'R':
          newPieces = rotatePiecesAroundAxis(newPieces, 'x', 1, true);
          break;
        case 'R\'':
          newPieces = rotatePiecesAroundAxis(newPieces, 'x', 1, false);
          break;
        case 'L':
          newPieces = rotatePiecesAroundAxis(newPieces, 'x', -1, false);
          break;
        case 'L\'':
          newPieces = rotatePiecesAroundAxis(newPieces, 'x', -1, true);
          break;
        case 'U':
          newPieces = rotatePiecesAroundAxis(newPieces, 'y', 1, true);
          break;
        case 'U\'':
          newPieces = rotatePiecesAroundAxis(newPieces, 'y', 1, false);
          break;
        case 'D':
          newPieces = rotatePiecesAroundAxis(newPieces, 'y', -1, false);
          break;
        case 'D\'':
          newPieces = rotatePiecesAroundAxis(newPieces, 'y', -1, true);
          break;
      }
      
      const newMoves = [...state.moves, face];
      return { pieces: newPieces, moves: newMoves, currentRotation: face };
    });
  },
  
  undoMove: () => {
    set((state) => {
      if (state.moves.length === 0) return state;
      
      const lastMove = state.moves[state.moves.length - 1];
      const inverseMove = lastMove.includes('\'') ? lastMove.replace('\'', '') : `${lastMove}\'`;
      
      let newPieces = [...state.pieces];
      state.rotateFace(inverseMove);
      
      const newMoves = state.moves.slice(0, -2);
      return { moves: newMoves };
    });
  },
  
  resetCube: () => {
    set({ pieces: createInitialCubeState(), moves: [], currentRotation: null });
  },

  autoSolve: async () => {
    const state = get();
    if (state.isSolving) return;

    set({ isSolving: true });

    // Reverse all moves to solve the cube
    const movesToSolve = [...state.moves].reverse().map(move => 
      move.includes('\'') ? move.replace('\'', '') : `${move}\'`
    );

    // Execute each move with a delay for animation
    for (const move of movesToSolve) {
      await sleep(500); // Wait for 500ms between moves
      state.rotateFace(move);
    }

    set({ isSolving: false, moves: [] });
  },
})); 