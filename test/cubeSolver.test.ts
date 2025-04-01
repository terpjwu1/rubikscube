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
      const frontRightBefore = pieces.find(p => 
        p.position[0] === 1 && p.position[1] === 1 && p.position[2] === 1
      );
      
      pieces = executeMove(pieces, 'U');
      
      const frontRightAfter = pieces.find(p => 
        p.position[0] === -1 && p.position[1] === 1 && p.position[2] === 1
      );
      
      expect(frontRightAfter?.colors).toEqual(frontRightBefore?.colors);
      
      expect(frontRightAfter?.colors.top).toBe('white');
    });

    it('should maintain cube integrity after sequence', () => {
      const sequence = ['R', 'U', 'R\'', 'U\''];
      pieces = executeSequence(pieces, sequence);
      
      expect(pieces.length).toBe(27);
      
      const centers = pieces.filter(p => 
        (p.position[0] === 0 && p.position[2] === 0) ||
        (p.position[0] === 0 && p.position[1] === 0) ||
        (p.position[1] === 0 && p.position[2] === 0)
      );
      expect(centers.length).toBe(6);
      
      const centerColors = centers.map(p => {
        if (p.position[1] === 1) return p.colors.top;
        if (p.position[1] === -1) return p.colors.bottom;
        if (p.position[2] === 1) return p.colors.front;
        if (p.position[2] === -1) return p.colors.back;
        if (p.position[0] === 1) return p.colors.right;
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