export type Color = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green' | 'black';
export type Face = 'F' | 'B' | 'R' | 'L' | 'U' | 'D' | null;

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