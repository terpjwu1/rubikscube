'use client';

import { useRef, useEffect } from 'react';
import { Mesh, Euler, MathUtils, Vector3, Matrix4 } from 'three';
import { useFrame } from '@react-three/fiber';
import { CubePiece as CubePieceType } from '@/app/store/cubeStore';
import { useCubeStore } from '@/app/store/cubeStore';

interface CubePieceProps {
  piece: CubePieceType;
}

const PIECE_SIZE = 0.95; // Slightly smaller than 1 to create gaps between pieces
const ROTATION_SPEED = 0.15; // Speed of rotation animation
const PULSE_SPEED = 3; // Speed of the pulsing effect
const MIN_EMISSION = 0.2; // Reduced minimum emission intensity
const MAX_EMISSION = 0.6; // Reduced maximum emission intensity to preserve colors
const OFFSET_DISTANCE = 0.2; // Distance to offset selected face pieces

const getEmissive = (face: 'F' | 'B' | 'R' | 'L' | 'U' | 'D' | null, position: [number, number, number], time: number): number => {
  if (!face) return 0;
  
  const [x, y, z] = position;
  let isSelectedFace = false;
  
  switch (face) {
    case 'F': isSelectedFace = z === 1; break;
    case 'B': isSelectedFace = z === -1; break;
    case 'R': isSelectedFace = x === 1; break;
    case 'L': isSelectedFace = x === -1; break;
    case 'U': isSelectedFace = y === 1; break;
    case 'D': isSelectedFace = y === -1; break;
  }

  if (!isSelectedFace) return 0;
  
  // Create a smoother pulsing effect using cosine
  const pulse = MIN_EMISSION + (MAX_EMISSION - MIN_EMISSION) * (0.5 + 0.5 * Math.cos(time * PULSE_SPEED));
  return pulse;
};

const getEmissiveColor = (color: string, isSelected: boolean): string => {
  if (!isSelected) return color;
  // Increase saturation for orange when selected
  if (color === 'orange') {
    return '#ff6000'; // More saturated orange
  }
  return color;
};

const getOffset = (face: 'F' | 'B' | 'R' | 'L' | 'U' | 'D' | null, position: [number, number, number]): [number, number, number] => {
  if (!face) return [0, 0, 0];
  
  const [x, y, z] = position;
  let offset: [number, number, number] = [0, 0, 0];
  
  switch (face) {
    case 'F': 
      if (z === 1) offset = [0, 0, OFFSET_DISTANCE];
      break;
    case 'B':
      if (z === -1) offset = [0, 0, -OFFSET_DISTANCE];
      break;
    case 'R':
      if (x === 1) offset = [OFFSET_DISTANCE, 0, 0];
      break;
    case 'L':
      if (x === -1) offset = [-OFFSET_DISTANCE, 0, 0];
      break;
    case 'U':
      if (y === 1) offset = [0, OFFSET_DISTANCE, 0];
      break;
    case 'D':
      if (y === -1) offset = [0, -OFFSET_DISTANCE, 0];
      break;
  }
  
  return offset;
};

export default function CubePiece({ piece }: CubePieceProps) {
  const meshRef = useRef<Mesh>(null);
  const selectedFace = useCubeStore(state => state.selectedFace);
  const currentRotation3D = useCubeStore(state => state.currentRotation);
  const timeRef = useRef(0);
  const targetOffset = useRef<[number, number, number]>([0, 0, 0]);
  const currentOffset = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    targetOffset.current = getOffset(selectedFace, piece.position);
  }, [selectedFace, piece.position]);

  useFrame((_, delta) => {
    timeRef.current += delta;

    if (meshRef.current) {
      // Handle face rotation animation
      if (currentRotation3D) {
        const [x, y, z] = piece.position;
        const isInRotatingFace = (
          (currentRotation3D.axis === 'x' && x === currentRotation3D.layer) ||
          (currentRotation3D.axis === 'y' && y === currentRotation3D.layer) ||
          (currentRotation3D.axis === 'z' && z === currentRotation3D.layer)
        );

        if (isInRotatingFace) {
          // Create matrices for transformation
          const rotationMatrix = new Matrix4();
          const toOriginMatrix = new Matrix4();
          const fromOriginMatrix = new Matrix4();
          
          // Calculate the center of rotation based on the layer
          let centerPoint = [0, 0, 0];
          switch (currentRotation3D.axis) {
            case 'x':
              centerPoint = [currentRotation3D.layer, 0, 0];
              break;
            case 'y':
              centerPoint = [0, currentRotation3D.layer, 0];
              break;
            case 'z':
              centerPoint = [0, 0, currentRotation3D.layer];
              break;
          }
          
          // Move to origin, rotate, then move back
          toOriginMatrix.makeTranslation(-centerPoint[0], -centerPoint[1], -centerPoint[2]);
          fromOriginMatrix.makeTranslation(centerPoint[0], centerPoint[1], centerPoint[2]);
          
          // Set the rotation based on the current angle
          switch (currentRotation3D.axis) {
            case 'x':
              rotationMatrix.makeRotationX(-currentRotation3D.angle);
              break;
            case 'y':
              rotationMatrix.makeRotationY(-currentRotation3D.angle);
              break;
            case 'z':
              rotationMatrix.makeRotationZ(-currentRotation3D.angle);
              break;
          }

          // Apply transformations in the correct order:
          // 1. Move to origin
          // 2. Rotate
          // 3. Move back
          meshRef.current.matrix.identity();
          meshRef.current.matrix.multiply(fromOriginMatrix);
          meshRef.current.matrix.multiply(rotationMatrix);
          meshRef.current.matrix.multiply(toOriginMatrix);
          meshRef.current.matrix.multiply(new Matrix4().makeTranslation(...piece.position));
          meshRef.current.matrixAutoUpdate = false;
        }
      } else {
        // Reset matrix when not rotating
        meshRef.current.matrix.identity();
        meshRef.current.matrixAutoUpdate = true;
        meshRef.current.position.set(...piece.position);
      }

      // Handle face separation animation
      currentOffset.current = currentOffset.current.map((curr, i) => {
        const target = targetOffset.current[i];
        return MathUtils.lerp(curr, target, ROTATION_SPEED);
      }) as [number, number, number];

      const [baseX, baseY, baseZ] = piece.position;
      const [offsetX, offsetY, offsetZ] = currentOffset.current;
      meshRef.current.position.set(
        baseX + offsetX,
        baseY + offsetY,
        baseZ + offsetZ
      );
    }
  });

  const { position, colors } = piece;

  return (
    <mesh
      ref={meshRef}
      position={position}
    >
      <boxGeometry args={[PIECE_SIZE, PIECE_SIZE, PIECE_SIZE]} />
      <meshStandardMaterial 
        color={colors.right} 
        emissive={getEmissiveColor(colors.right, getEmissive(selectedFace, [1, position[1], position[2]], timeRef.current) > 0)}
        emissiveIntensity={getEmissive(selectedFace, [1, position[1], position[2]], timeRef.current)}
        metalness={0.1}
        roughness={0.8}
        attach="material-0" 
      />
      <meshStandardMaterial 
        color={colors.left} 
        emissive={getEmissiveColor(colors.left, getEmissive(selectedFace, [-1, position[1], position[2]], timeRef.current) > 0)}
        emissiveIntensity={getEmissive(selectedFace, [-1, position[1], position[2]], timeRef.current)}
        metalness={0.1}
        roughness={0.8}
        attach="material-1" 
      />
      <meshStandardMaterial 
        color={colors.top} 
        emissive={getEmissiveColor(colors.top, getEmissive(selectedFace, [position[0], 1, position[2]], timeRef.current) > 0)}
        emissiveIntensity={getEmissive(selectedFace, [position[0], 1, position[2]], timeRef.current)}
        metalness={0.1}
        roughness={0.8}
        attach="material-2" 
      />
      <meshStandardMaterial 
        color={colors.bottom} 
        emissive={getEmissiveColor(colors.bottom, getEmissive(selectedFace, [position[0], -1, position[2]], timeRef.current) > 0)}
        emissiveIntensity={getEmissive(selectedFace, [position[0], -1, position[2]], timeRef.current)}
        metalness={0.1}
        roughness={0.8}
        attach="material-3" 
      />
      <meshStandardMaterial 
        color={colors.front} 
        emissive={getEmissiveColor(colors.front, getEmissive(selectedFace, [position[0], position[1], 1], timeRef.current) > 0)}
        emissiveIntensity={getEmissive(selectedFace, [position[0], position[1], 1], timeRef.current)}
        metalness={0.1}
        roughness={0.8}
        attach="material-4" 
      />
      <meshStandardMaterial 
        color={colors.back} 
        emissive={getEmissiveColor(colors.back, getEmissive(selectedFace, [position[0], position[1], -1], timeRef.current) > 0)}
        emissiveIntensity={getEmissive(selectedFace, [position[0], position[1], -1], timeRef.current)}
        metalness={0.1}
        roughness={0.8}
        attach="material-5" 
      />
    </mesh>
  );
} 