import { create } from 'zustand';
import type { Color, Face, CubePiece } from '../types/cube';

export interface CubeState {
  pieces: CubePiece[];
  moves: string[];
  scrambleMoves: string[];
  solveMoves: string[];
  isAnimating: boolean;
  currentRotation: {
    axis: 'x' | 'y' | 'z';
    layer: number;
    angle: number;
    clockwise: boolean;
    pieces: number[];
  } | null;
  isSolving: boolean;
  selectedFace: Face;
  initializeCube: () => void;
  selectFace: (face: Face) => void;
  rotateFace: (face: string, isSolveMove?: boolean) => void;
  undoMove: () => void;
  resetCube: () => void;
  autoSolve: () => Promise<void>;
  randomize: () => Promise<void>;
}

// Helper function to create initial cube state
export const createInitialCubeState = (): CubePiece[] => {
  const pieces: CubePiece[] = [];
  
  // Generate all 27 pieces (3x3x3)
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        pieces.push({
          position: [x, y, z],
          rotation: [0, 0, 0],
          colors: {
            front: z === 1 ? 'red' : 'black',
            back: z === -1 ? 'orange' : 'black',
            top: y === 1 ? 'white' : 'black',
            bottom: y === -1 ? 'yellow' : 'black',
            left: x === -1 ? 'green' : 'black',
            right: x === 1 ? 'blue' : 'black',
          },
        });
      }
    }
  }
  
  return pieces;
};

// Helper function to rotate pieces around an axis
export const rotatePiecesAroundAxis = (pieces: CubePiece[], axis: 'x' | 'y' | 'z', layer: number, clockwise: boolean): CubePiece[] => {
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

// Helper functions for the solver
export const findPiece = (pieces: CubePiece[], colors: Partial<Record<keyof CubePiece['colors'], Color>>): CubePiece | undefined => {
  return pieces.find(piece => {
    return Object.entries(colors).every(([face, color]) => 
      piece.colors[face as keyof CubePiece['colors']] === color
    );
  });
};

export const isCrossPieceSolved = (piece: CubePiece, targetY: number): boolean => {
  const [x, y, z] = piece.position;
  if (y !== targetY) return false;

  // Check if the white/yellow sticker is facing up/down
  if (targetY === 1 && piece.colors.top !== 'white') return false;
  if (targetY === -1 && piece.colors.bottom !== 'yellow') return false;

  // Check if the other color is aligned correctly
  if (z === 1 && piece.colors.front !== 'red') return false;
  if (z === -1 && piece.colors.back !== 'orange') return false;
  if (x === 1 && piece.colors.right !== 'blue') return false;
  if (x === -1 && piece.colors.left !== 'green') return false;

  return true;
};

export const isCornerSolved = (piece: CubePiece, targetY: number): boolean => {
  const [x, y, z] = piece.position;
  if (y !== targetY) return false;

  // Check if white/yellow sticker is facing up/down
  if (targetY === 1 && piece.colors.top !== 'white') return false;
  if (targetY === -1 && piece.colors.bottom !== 'yellow') return false;

  // Check if other colors are aligned
  if (z === 1 && piece.colors.front !== 'red') return false;
  if (z === -1 && piece.colors.back !== 'orange') return false;
  if (x === 1 && piece.colors.right !== 'blue') return false;
  if (x === -1 && piece.colors.left !== 'green') return false;

  return true;
};

export const isMiddleEdgeSolved = (piece: CubePiece): boolean => {
  const [x, y, z] = piece.position;
  if (y !== 0) return false; // Must be in middle layer

  // Check if colors match their centers
  if (z === 1 && piece.colors.front !== 'red') return false;
  if (z === -1 && piece.colors.back !== 'orange') return false;
  if (x === 1 && piece.colors.right !== 'blue') return false;
  if (x === -1 && piece.colors.left !== 'green') return false;

  return true;
};

const executeSequence = async (state: CubeState, moves: string[]) => {
  for (const move of moves) {
    await new Promise<void>(resolve => {
      const checkAndExecute = () => {
        if (!state.isAnimating) {
          state.rotateFace(move, state.isSolving);
          setTimeout(resolve, 400);
        } else {
          setTimeout(checkAndExecute, 10);
        }
      };
      checkAndExecute();
    });
  }
};

const solveWhiteCross = async (state: CubeState) => {
  const { pieces } = state;
  
  // Define the target positions for the white cross pieces
  const edgePieces: Array<{colors: Partial<Record<keyof CubePiece['colors'], Color>>}> = [
    { colors: { front: 'red', top: 'white' } },
    { colors: { right: 'blue', top: 'white' } },
    { colors: { back: 'orange', top: 'white' } },
    { colors: { left: 'green', top: 'white' } }
  ];

  // First, find all white edge pieces and get them to the top layer
  for (const target of edgePieces) {
    const piece = pieces.find(p => 
      Object.entries(target.colors).some(([face, color]) => 
        p.colors[face as keyof CubePiece['colors']] === color ||
        Object.values(p.colors).includes(color)
      )
    );
    
    if (!piece) continue;
    if (isCrossPieceSolved(piece, 1)) continue;

    const [x, y, z] = piece.position;
    let moves: string[] = [];

    // If piece is in bottom layer, bring it up
    if (y === -1) {
      if (z === 1) moves = ['F', 'F'];
      else if (z === -1) moves = ['B', 'B'];
      else if (x === 1) moves = ['R', 'R'];
      else if (x === -1) moves = ['L', 'L'];
    }
    // If piece is in middle layer, bring it up
    else if (y === 0) {
      if (z === 1) {
        if (x === 1) moves = ['R', 'U', 'R\''];
        else if (x === -1) moves = ['L\'', 'U\'', 'L'];
      } else if (z === -1) {
        if (x === 1) moves = ['R\'', 'U\'', 'R'];
        else if (x === -1) moves = ['L', 'U', 'L\''];
      }
    }

    if (moves.length > 0) {
      await executeSequence(state, moves);
    }
  }

  // Now solve each piece of the white cross
  for (const target of edgePieces) {
    const piece = findPiece(pieces, target.colors);
    if (!piece) continue;
    if (isCrossPieceSolved(piece, 1)) continue;

    const [x, y, z] = piece.position;
    let moves: string[] = [];

    // The piece should now be in the top layer
    // If white is facing up, we need to insert it correctly
    if (piece.colors.top === 'white') {
      if (z === 1) {
        if (target.colors.front) moves = ['F', 'F'];
        else if (target.colors.right) moves = ['U', 'R', 'R'];
        else if (target.colors.back) moves = ['U', 'U', 'B', 'B'];
        else if (target.colors.left) moves = ['U\'', 'L', 'L'];
      } else if (z === -1) {
        if (target.colors.front) moves = ['U', 'U', 'F', 'F'];
        else if (target.colors.right) moves = ['U', 'R', 'R'];
        else if (target.colors.back) moves = ['B', 'B'];
        else if (target.colors.left) moves = ['U\'', 'L', 'L'];
      } else if (x === 1) {
        if (target.colors.front) moves = ['U\'', 'F', 'F'];
        else if (target.colors.right) moves = ['R', 'R'];
        else if (target.colors.back) moves = ['U', 'B', 'B'];
        else if (target.colors.left) moves = ['U', 'U', 'L', 'L'];
      } else if (x === -1) {
        if (target.colors.front) moves = ['U', 'F', 'F'];
        else if (target.colors.right) moves = ['U', 'U', 'R', 'R'];
        else if (target.colors.back) moves = ['U\'', 'B', 'B'];
        else if (target.colors.left) moves = ['L', 'L'];
      }
    }
    // If white is not facing up, we need to flip the edge
    else {
      if (z === 1) moves = ['F', 'U', 'R', 'U\''];
      else if (z === -1) moves = ['B', 'U\'', 'L', 'U'];
      else if (x === 1) moves = ['R', 'U', 'F', 'U\''];
      else if (x === -1) moves = ['L', 'U\'', 'F', 'U'];
    }

    await executeSequence(state, moves);
  }
};

const solveWhiteCorners = async (state: CubeState) => {
  const { pieces } = state;
  
  // Find and solve each corner piece
  const cornerPieces: Array<{colors: Partial<Record<keyof CubePiece['colors'], Color>>}> = [
    { colors: { front: 'red' as Color, right: 'blue' as Color, top: 'white' as Color } },
    { colors: { front: 'red' as Color, left: 'green' as Color, top: 'white' as Color } },
    { colors: { back: 'orange' as Color, right: 'blue' as Color, top: 'white' as Color } },
    { colors: { back: 'orange' as Color, left: 'green' as Color, top: 'white' as Color } }
  ];

  for (const target of cornerPieces) {
    const piece = findPiece(pieces, target.colors);
    if (!piece) continue;

    const [x, y, z] = piece.position;
    
    // If piece is already solved, continue to next piece
    if (isCornerSolved(piece, 1)) continue;

    // Generate moves based on piece position and orientation
    let moves: string[] = [];
    
    // First, get the piece to the bottom layer if it's in the top layer incorrectly
    if (y === 1 && !isCornerSolved(piece, 1)) {
      if (z === 1 && x === 1) moves = ['R', 'U', 'R\''];
      else if (z === 1 && x === -1) moves = ['L\'', 'U\'', 'L'];
      else if (z === -1 && x === 1) moves = ['R\'', 'U\'', 'R'];
      else if (z === -1 && x === -1) moves = ['L', 'U', 'L\''];
      await executeSequence(state, moves);
    }

    // Now the piece should be in the bottom layer or correctly placed
    // Find the piece again as it may have moved
    const updatedPiece = findPiece(state.pieces, target.colors);
    if (!updatedPiece || isCornerSolved(updatedPiece, 1)) continue;

    const [newX, newY, newZ] = updatedPiece.position;
    moves = [];

    // If the piece is in the bottom layer, position it under its correct spot and insert
    if (newY === -1) {
      // First, determine the target position
      let targetX = 1, targetZ = 1;
      if (target.colors.left) targetX = -1;
      if (target.colors.back) targetZ = -1;

      // Move U face to align with the piece
      if (targetX === 1 && targetZ === 1) {
        // Front-right corner
        if (newX === 1 && newZ === 1) moves = ['U', 'R', 'U\'', 'R\''];
        else if (newX === 1 && newZ === -1) moves = ['U', 'U', 'R', 'U\'', 'R\''];
        else if (newX === -1 && newZ === -1) moves = ['U\'', 'R', 'U\'', 'R\''];
        else if (newX === -1 && newZ === 1) moves = ['R', 'U\'', 'R\''];
      } else if (targetX === -1 && targetZ === 1) {
        // Front-left corner
        if (newX === 1 && newZ === 1) moves = ['U', 'L\'', 'U', 'L'];
        else if (newX === 1 && newZ === -1) moves = ['U', 'U', 'L\'', 'U', 'L'];
        else if (newX === -1 && newZ === -1) moves = ['U\'', 'L\'', 'U', 'L'];
        else if (newX === -1 && newZ === 1) moves = ['L\'', 'U', 'L'];
      } else if (targetX === 1 && targetZ === -1) {
        // Back-right corner
        if (newX === 1 && newZ === 1) moves = ['U\'', 'R\'', 'U', 'R'];
        else if (newX === 1 && newZ === -1) moves = ['R\'', 'U', 'R'];
        else if (newX === -1 && newZ === -1) moves = ['U', 'R\'', 'U', 'R'];
        else if (newX === -1 && newZ === 1) moves = ['U', 'U', 'R\'', 'U', 'R'];
      } else {
        // Back-left corner
        if (newX === 1 && newZ === 1) moves = ['U\'', 'L', 'U\'', 'L\''];
        else if (newX === 1 && newZ === -1) moves = ['U', 'U', 'L', 'U\'', 'L\''];
        else if (newX === -1 && newZ === -1) moves = ['L', 'U\'', 'L\''];
        else if (newX === -1 && newZ === 1) moves = ['U', 'L', 'U\'', 'L\''];
      }

      await executeSequence(state, moves);
    }

    // Check if we need to orient the corner
    const finalPiece = findPiece(state.pieces, target.colors);
    if (finalPiece && !isCornerSolved(finalPiece, 1)) {
      // Apply sexy move (R U R' U') until corner is oriented correctly
      let sexyMoves = ['R', 'U', 'R\'', 'U\''];
      for (let i = 0; i < 3; i++) {
        await executeSequence(state, sexyMoves);
        const check = findPiece(state.pieces, target.colors);
        if (check && isCornerSolved(check, 1)) break;
      }
    }
  }
};

const solveMiddleLayer = async (state: CubeState) => {
  const { pieces } = state;
  
  // Find and solve each middle edge piece
  const middleEdges: Array<{colors: Partial<Record<keyof CubePiece['colors'], Color>>}> = [
    { colors: { front: 'red' as Color, right: 'blue' as Color } },
    { colors: { front: 'red' as Color, left: 'green' as Color } },
    { colors: { back: 'orange' as Color, right: 'blue' as Color } },
    { colors: { back: 'orange' as Color, left: 'green' as Color } }
  ];

  for (const target of middleEdges) {
    const piece = findPiece(pieces, target.colors);
    if (!piece) continue;

    // If piece is already solved, continue to next piece
    if (isMiddleEdgeSolved(piece)) continue;

    const [x, y, z] = piece.position;
    let moves: string[] = [];

    // If piece is in middle layer but wrong position/orientation, move it to top layer
    if (y === 0 && !isMiddleEdgeSolved(piece)) {
      if (z === 1) {
        if (x === 1) moves = ['U', 'R', 'U\'', 'R\'', 'U\'', 'F\'', 'U', 'F'];
        else moves = ['U\'', 'L\'', 'U', 'L', 'U', 'F', 'U\'', 'F\''];
      } else if (z === -1) {
        if (x === 1) moves = ['U', 'R', 'U\'', 'R\'', 'U\'', 'B\'', 'U', 'B'];
        else moves = ['U\'', 'L\'', 'U', 'L', 'U', 'B', 'U\'', 'B\''];
      }
      await executeSequence(state, moves);
    }

    // Find the piece again as it may have moved
    const updatedPiece = findPiece(state.pieces, target.colors);
    if (!updatedPiece || isMiddleEdgeSolved(updatedPiece)) continue;

    // Now the piece should be in the top layer or already solved
    const [newX, newY, newZ] = updatedPiece.position;
    moves = [];

    // Determine target position
    let targetX = 1, targetZ = 1;
    if (target.colors.left) targetX = -1;
    if (target.colors.back) targetZ = -1;

    // If piece is in top layer, align and insert
    if (newY === 1) {
      // First, determine which face the colored sticker is facing
      let colorFacingUp = updatedPiece.colors.top;
      let moves: string[] = [];

      if (targetZ === 1) { // Front face target
        if (colorFacingUp === 'red') {
          // Color facing up is red, need right or left insert
          if (targetX === 1) { // Right insert
            moves = ['U', 'R', 'U\'', 'R\'', 'U\'', 'F\'', 'U', 'F'];
          } else { // Left insert
            moves = ['U\'', 'L\'', 'U', 'L', 'U', 'F', 'U\'', 'F\''];
          }
        } else {
          // Color facing up is blue/green, need front insert
          if (targetX === 1) { // Right side
            moves = ['U\'', 'F\'', 'U', 'F', 'U', 'R', 'U\'', 'R\''];
          } else { // Left side
            moves = ['U', 'F', 'U\'', 'F\'', 'U\'', 'L\'', 'U', 'L'];
          }
        }
      } else { // Back face target
        if (colorFacingUp === 'orange') {
          // Color facing up is orange, need right or left insert
          if (targetX === 1) { // Right insert
            moves = ['U', 'R', 'U\'', 'R\'', 'U\'', 'B\'', 'U', 'B'];
          } else { // Left insert
            moves = ['U\'', 'L\'', 'U', 'L', 'U', 'B', 'U\'', 'B\''];
          }
        } else {
          // Color facing up is blue/green, need back insert
          if (targetX === 1) { // Right side
            moves = ['U\'', 'B\'', 'U', 'B', 'U', 'R', 'U\'', 'R\''];
          } else { // Left side
            moves = ['U', 'B', 'U\'', 'B\'', 'U\'', 'L\'', 'U', 'L'];
          }
        }
      }

      // Align U face first if needed
      if (newZ === 1 && newX !== targetX) moves.unshift('U');
      else if (newZ === -1 && newX === targetX) moves.unshift('U');
      else if (newX === 1 && newZ === targetZ) moves.unshift('U');
      else if (newX === -1 && newZ !== targetZ) moves.unshift('U');

      await executeSequence(state, moves);
    }
  }
};

const solveYellowCornersPosition = async (state: CubeState) => {
  const { pieces } = state;
  
  // First, check which corners are in their correct positions
  const cornerPositions = [
    { x: 1, z: 1, colors: { front: 'red', right: 'blue' } },
    { x: -1, z: 1, colors: { front: 'red', left: 'green' } },
    { x: 1, z: -1, colors: { back: 'orange', right: 'blue' } },
    { x: -1, z: -1, colors: { back: 'orange', left: 'green' } }
  ];

  let maxIterations = 10; // Prevent infinite loops
  let correctCount = 0;
  let headlightPosition = -1;

  console.log('Starting yellow corners position...');

  do {
    correctCount = 0;
    headlightPosition = -1;

    // Check each corner position
    for (let i = 0; i < 4; i++) {
      const { x, z, colors } = cornerPositions[i];
      const piece = pieces.find(p => 
        p.position[0] === x && 
        p.position[1] === -1 && 
        p.position[2] === z
      );

      if (piece) {
        // Check if the corner has the correct colors (ignoring orientation)
        const hasColors = Object.entries(colors).every(([face, color]) => {
          const pieceColors = [
            piece.colors[face as keyof CubePiece['colors']],
            piece.colors.bottom,
            piece.colors[face === 'front' ? 'back' : face === 'back' ? 'front' : 
                        face === 'left' ? 'right' : 'left' as keyof CubePiece['colors']]
          ];
          return pieceColors.includes(color);
        });
        
        if (hasColors) {
          correctCount++;
          if (correctCount === 1) headlightPosition = i;
        }
      }
    }

    console.log(`Iteration ${10 - maxIterations}: Correct corners = ${correctCount}, Headlight position = ${headlightPosition}`);

    if (correctCount < 4 && maxIterations > 0) {
      let moves: string[] = [];
      
      if (correctCount === 0 || correctCount === 1) {
        // Align any headlights to the back
        if (headlightPosition !== -1) {
          const rotationsNeeded = (3 - headlightPosition + 4) % 4;
          console.log(`Rotating U face ${rotationsNeeded} times to align headlights`);
          for (let i = 0; i < rotationsNeeded; i++) {
            await executeSequence(state, ['U']);
          }
        }
        console.log('Applying corner permutation algorithm');
        moves = ['U', 'R', 'U\'', 'L\'', 'U', 'R\'', 'U\'', 'L'];
        await executeSequence(state, moves);
      } else {
        console.log(`Skipping algorithm, found ${correctCount} correct corners`);
      }
    }

    maxIterations--;
  } while (correctCount < 4 && maxIterations > 0);

  if (maxIterations === 0) {
    console.log('Warning: Yellow corners position reached max iterations');
  } else {
    console.log('Yellow corners position complete!');
  }
};

const solveYellowCornersOrientation = async (state: CubeState) => {
  const { pieces } = state;
  
  // Orient each corner one at a time
  const corners = pieces.filter(p => {
    const [x, y, z] = p.position;
    return y === -1 && Math.abs(x) === 1 && Math.abs(z) === 1;
  });

  for (const corner of corners) {
    if (corner.colors.bottom === 'yellow') continue;

    // Position the corner in front-right position
    const [x, _, z] = corner.position;
    let moves: string[] = [];
    
    if (x === -1 && z === 1) moves = ['U'];
    else if (x === -1 && z === -1) moves = ['U', 'U'];
    else if (x === 1 && z === -1) moves = ['U\''];
    
    if (moves.length > 0) {
      await executeSequence(state, moves);
    }

    // Apply R U R' U' until the corner is oriented correctly
    let attempts = 0;
    while (attempts < 3) {
      const currentCorner = state.pieces.find(p => 
        p.position[0] === 1 && p.position[1] === -1 && p.position[2] === 1
      );
      
      if (currentCorner?.colors.bottom === 'yellow') break;
      
      await executeSequence(state, ['R', 'U', 'R\'', 'U\'']);
      attempts++;
    }
  }

  // Final U moves to align corners with centers
  const finalAlignMoves: string[] = [];
  const frontRightCorner = pieces.find(p => 
    p.position[0] === 1 && p.position[1] === -1 && p.position[2] === 1
  );
  
  if (frontRightCorner) {
    if (frontRightCorner.colors.front === 'red') {
      // Already aligned
    } else if (frontRightCorner.colors.front === 'blue') {
      finalAlignMoves.push('U\'');
    } else if (frontRightCorner.colors.front === 'orange') {
      finalAlignMoves.push('U', 'U');
    } else if (frontRightCorner.colors.front === 'green') {
      finalAlignMoves.push('U');
    }
  }
  
  if (finalAlignMoves.length > 0) {
    await executeSequence(state, finalAlignMoves);
  }
};

const solveYellowCross = async (state: CubeState) => {
  const { pieces } = state;
  
  // Helper function to count yellow stickers facing down
  const getYellowDownCount = () => {
    return pieces.filter(p => {
      const [x, y, z] = p.position;
      return y === -1 && ((x === 0 && z !== 0) || (x !== 0 && z === 0)) && p.colors.bottom === 'yellow';
    }).length;
  };

  // Helper function to get the current pattern
  const getYellowPattern = () => {
    return pieces
      .filter(p => {
        const [x, y, z] = p.position;
        return y === -1 && ((x === 0 && z !== 0) || (x !== 0 && z === 0));
      })
      .filter(p => p.colors.bottom === 'yellow')
      .map(p => {
        const [x, _, z] = p.position;
        if (z === 1) return 'F';
        if (z === -1) return 'B';
        if (x === 1) return 'R';
        return 'L';
      });
  };

  let yellowDown = getYellowDownCount();
  if (yellowDown === 4) return;

  // First, handle the dot case (0 or 1 yellow)
  if (yellowDown <= 1) {
    await executeSequence(state, ['F', 'R', 'U', 'R\'', 'U\'', 'F\'']);
    yellowDown = getYellowDownCount();
  }

  // Now we should have an L shape or a line
  let pattern = getYellowPattern();
  
  // If we have an L shape
  if (pattern.length === 2 && 
      !((pattern.includes('F') && pattern.includes('B')) || 
        (pattern.includes('L') && pattern.includes('R')))) {
    // Align L shape to front-right
    if (pattern.includes('F') && pattern.includes('R')) {
      // Already aligned
    } else if (pattern.includes('R') && pattern.includes('B')) {
      await executeSequence(state, ['U']);
    } else if (pattern.includes('B') && pattern.includes('L')) {
      await executeSequence(state, ['U', 'U']);
    } else if (pattern.includes('L') && pattern.includes('F')) {
      await executeSequence(state, ['U\'']);
    }
    await executeSequence(state, ['F', 'R', 'U', 'R\'', 'U\'', 'F\'']);
  }
  // If we have a line
  else if (pattern.length === 2) {
    // Align line to horizontal
    if (pattern.includes('F') && pattern.includes('B')) {
      await executeSequence(state, ['U']);
    }
    await executeSequence(state, ['F', 'R', 'U', 'R\'', 'U\'', 'F\'']);
  }

  // Final check and one more algorithm if needed
  yellowDown = getYellowDownCount();
  if (yellowDown < 4) {
    await executeSequence(state, ['F', 'R', 'U', 'R\'', 'U\'', 'F\'']);
  }
};

export const useCubeStore = create<CubeState>((set, get) => ({
  pieces: createInitialCubeState(),
  moves: [],
  scrambleMoves: [],
  solveMoves: [],
  isAnimating: false,
  currentRotation: null,
  isSolving: false,
  selectedFace: null,
  
  initializeCube: () => {
    set({ 
      pieces: createInitialCubeState(), 
      selectedFace: null, 
      currentRotation: null,
      moves: [],
      scrambleMoves: [],
      solveMoves: []
    });
  },
  
  selectFace: (face: Face) => {
    set({ selectedFace: face });
  },
  
  rotateFace: (face: string, isSolveMove: boolean = false) => {
    const state = get();
    if (state.isAnimating) return;

    set((state) => {
      let axis: 'x' | 'y' | 'z';
      let layer: number;
      let clockwise: boolean;
      
      switch (face) {
        case 'F':
          axis = 'z'; layer = 1; clockwise = true;
          break;
        case 'F\'':
          axis = 'z'; layer = 1; clockwise = false;
          break;
        case 'B':
          axis = 'z'; layer = -1; clockwise = false;
          break;
        case 'B\'':
          axis = 'z'; layer = -1; clockwise = true;
          break;
        case 'R':
          axis = 'x'; layer = 1; clockwise = true;
          break;
        case 'R\'':
          axis = 'x'; layer = 1; clockwise = false;
          break;
        case 'L':
          axis = 'x'; layer = -1; clockwise = false;
          break;
        case 'L\'':
          axis = 'x'; layer = -1; clockwise = true;
          break;
        case 'U':
          axis = 'y'; layer = 1; clockwise = true;
          break;
        case 'U\'':
          axis = 'y'; layer = 1; clockwise = false;
          break;
        case 'D':
          axis = 'y'; layer = -1; clockwise = false;
          break;
        case 'D\'':
          axis = 'y'; layer = -1; clockwise = true;
          break;
        default:
          return state;
      }

      return {
        ...state,
        isAnimating: true,
        currentRotation: {
          axis,
          layer,
          angle: 0,
          clockwise,
          pieces: []
        }
      };
    });

    // Start the rotation animation
    const animationDuration = 300;
    const fps = 60;
    const frames = animationDuration / (1000 / fps);
    let frame = 0;

    const animate = () => {
      if (frame >= frames) {
        // Animation complete, update the actual piece positions and colors
        set(state => {
          const newPieces = rotatePiecesAroundAxis(
            state.pieces,
            state.currentRotation!.axis,
            state.currentRotation!.layer,
            state.currentRotation!.clockwise
          );
          return {
            ...state,
            pieces: newPieces,
            isAnimating: false,
            currentRotation: null,
            moves: [...state.moves, face],
            solveMoves: isSolveMove ? [...state.solveMoves, face] : state.solveMoves,
            scrambleMoves: !isSolveMove && !state.isSolving ? [...state.scrambleMoves, face] : state.scrambleMoves
          };
        });
        return;
      }

      frame++;
      set(state => ({
        ...state,
        currentRotation: {
          ...state.currentRotation!,
          angle: (Math.PI / 2 / frames) * frame * (state.currentRotation!.clockwise ? 1 : -1)
        }
      }));
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  },
  
  undoMove: () => {
    set((state) => {
      if (state.moves.length === 0) return state;
      
      const lastMove = state.moves[state.moves.length - 1];
      const inverseMove = lastMove.includes('\'') ? lastMove.replace('\'', '') : `${lastMove}\'`;
      
      let newPieces = [...state.pieces];
      state.rotateFace(inverseMove);
      
      return {
        ...state,
        moves: state.moves.slice(0, -2)
      };
    });
  },

  resetCube: () => {
    set(state => ({
      ...state,
      pieces: createInitialCubeState(),
      moves: [],
      scrambleMoves: [],
      solveMoves: [],
      isAnimating: false,
      currentRotation: null,
      isSolving: false,
      selectedFace: null
    }));
  },

  autoSolve: async () => {
    const state = get();
    if (state.isSolving) return;

    set({ isSolving: true });

    try {
      console.log('Starting solve...');
      
      console.log('Solving white cross...');
      await solveWhiteCross(state);
      
      console.log('Solving white corners...');
      await solveWhiteCorners(state);
      
      console.log('Solving middle layer...');
      await solveMiddleLayer(state);
      
      console.log('Solving yellow cross...');
      await solveYellowCross(state);
      
      console.log('Solving yellow corners position...');
      await solveYellowCornersPosition(state);
      
      console.log('Solving yellow corners orientation...');
      await solveYellowCornersOrientation(state);
      
      console.log('Solve complete!');
    } catch (error) {
      console.error('Error during solve:', error);
    } finally {
      set({ isSolving: false });
    }
  },

  randomize: async () => {
    const state = get();
    if (state.isAnimating || state.isSolving) return;

    const moves = ['F', 'B', 'R', 'L', 'U', 'D', 'F\'', 'B\'', 'R\'', 'L\'', 'U\'', 'D\''];
    const sequence = Array.from({ length: 20 }, () => moves[Math.floor(Math.random() * moves.length)]);
    
    for (const move of sequence) {
      await executeSequence(state, [move]);
    }
  }
}));