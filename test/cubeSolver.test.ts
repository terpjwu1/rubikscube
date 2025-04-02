import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialCubeState, rotatePiecesAroundAxis } from '../app/store/cubeStore';
import type { CubePiece } from '../app/types/cube';

// Helper function to execute a move without animation
const executeMove = (pieces: CubePiece[], move: string): CubePiece[] => {
  let axis: 'x' | 'y' | 'z';
  let layer: number;
  let clockwise: boolean;
  
  switch (move) {
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
      return pieces;
  }

  return rotatePiecesAroundAxis(pieces, axis, layer, clockwise);
};

// Helper function to execute a sequence of moves
const executeSequence = (pieces: CubePiece[], moves: string[]): CubePiece[] => {
  return moves.reduce((currentPieces, move) => executeMove(currentPieces, move), pieces);
};

// Helper function to check if white cross is solved
const isWhiteCrossSolved = (pieces: CubePiece[]): boolean => {
  const whiteEdges = pieces.filter(p => {
    const [x, y, z] = p.position;
    return y === 1 && ((x === 0 && z !== 0) || (x !== 0 && z === 0));
  });

  return whiteEdges.every(edge => {
    const [x, _, z] = edge.position;
    if (edge.colors.top !== 'white') return false;
    
    // Check if edge colors match centers
    if (z === 1) return edge.colors.front === 'red';
    if (z === -1) return edge.colors.back === 'orange';
    if (x === 1) return edge.colors.right === 'blue';
    if (x === -1) return edge.colors.left === 'green';
    return false;
  });
};

describe('Cube Solver', () => {
  let pieces: CubePiece[];

  beforeEach(() => {
    pieces = createInitialCubeState();
  });

  describe('Initial State', () => {
    it('should create a solved cube state', () => {
      expect(pieces.length).toBe(27);
      expect(isWhiteCrossSolved(pieces)).toBe(true);
    });

    it('should have white center on top', () => {
      const whiteCenter = pieces.find(p => 
        p.position[0] === 0 && p.position[1] === 1 && p.position[2] === 0
      );
      expect(whiteCenter?.colors.top).toBe('white');
    });
  });

  describe('Move Execution', () => {
    it('should correctly execute U move', () => {
      // Get the front-right piece before the move
      const frontRightBefore = pieces.find(p => 
        p.position[0] === 1 && p.position[1] === 1 && p.position[2] === 1
      );
      
      // Execute U move
      pieces = executeMove(pieces, 'U');
      
      // After a U move, the front-right piece should move to front-left
      const pieceAfter = pieces.find(p => 
        p.position[0] === -1 && p.position[1] === 1 && p.position[2] === 1
      );
      
      // The top color (white) should stay the same
      expect(pieceAfter?.colors.top).toBe('white');
      
      // The front color should now be what was the right color
      expect(pieceAfter?.colors.front).toBe(frontRightBefore?.colors.right);
      
      // The right color should now be what was the back color
      expect(pieceAfter?.colors.right).toBe(frontRightBefore?.colors.back);
      
      // The back color should now be what was the left color
      expect(pieceAfter?.colors.back).toBe(frontRightBefore?.colors.left);
      
      // The left color should now be what was the front color
      expect(pieceAfter?.colors.left).toBe(frontRightBefore?.colors.front);
    });

    it('should maintain cube integrity after sequence', () => {
      const sequence = ['R', 'U', 'R\'', 'U\''];
      pieces = executeSequence(pieces, sequence);
      
      // Check if we still have all pieces
      expect(pieces.length).toBe(27);
      
      // Check if we have exactly one center of each color
      const centers = pieces.filter(p => {
        const [x, y, z] = p.position;
        // A center piece has exactly two coordinates that are 0
        const zeroCount = [x, y, z].filter(coord => coord === 0).length;
        return zeroCount === 2;
      });
      expect(centers.length).toBe(6);
      
      // Check if centers have correct colors
      const centerColors = centers.map(p => {
        const [x, y, z] = p.position;
        if (y === 1) return p.colors.top;
        if (y === -1) return p.colors.bottom;
        if (z === 1) return p.colors.front;
        if (z === -1) return p.colors.back;
        if (x === 1) return p.colors.right;
        return p.colors.left;
      });
      
      expect(centerColors).toContain('white');
      expect(centerColors).toContain('yellow');
      expect(centerColors).toContain('red');
      expect(centerColors).toContain('orange');
      expect(centerColors).toContain('blue');
      expect(centerColors).toContain('green');
    });
  });

  describe('White Cross Tests', () => {
    it('should identify white edge pieces', () => {
      const whiteEdges = pieces.filter(p => {
        const [x, y, z] = p.position;
        const isEdge = (x === 0 && z !== 0) || (x !== 0 && z === 0);
        return Object.values(p.colors).includes('white') && isEdge;
      });
      
      expect(whiteEdges.length).toBe(4);
    });

    it('should solve white cross after simple scramble', () => {
      // Apply a simple scramble that moves white edges
      const scramble = ['F', 'R', 'U'];
      pieces = executeSequence(pieces, scramble);
      
      // TODO: Call solveWhiteCross when it's exported
      // await solveWhiteCross({ pieces, moves: [] });
      
      // For now, just verify the scramble broke the white cross
      expect(isWhiteCrossSolved(pieces)).toBe(false);
    });
  });
}); 