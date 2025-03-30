'use client';

import { useRef, useEffect } from 'react';
import { Mesh, Euler, MathUtils, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { CubePiece as CubePieceType } from '@/app/store/cubeStore';
import { useCubeStore } from '@/app/store/cubeStore';

interface CubePieceProps {
  piece: CubePieceType;
}

const PIECE_SIZE = 0.95; // Slightly smaller than 1 to create gaps between pieces
const ROTATION_SPEED = 0.15; // Speed of rotation animation
const PULSE_SPEED = 3; // Speed of the pulsing effect
const MIN_EMISSION = 0.3; // Minimum emission intensity
const MAX_EMISSION = 2.0; // Maximum emission intensity
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
  const targetRotation = useRef<[number, number, number]>([0, 0, 0]);
  const currentRotation = useRef<[number, number, number]>([0, 0, 0]);
  const selectedFace = useCubeStore(state => state.selectedFace);
  const timeRef = useRef(0);
  const targetOffset = useRef<[number, number, number]>([0, 0, 0]);
  const currentOffset = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    targetRotation.current = piece.rotation;
  }, [piece.rotation]);

  useEffect(() => {
    targetOffset.current = getOffset(selectedFace, piece.position);
  }, [selectedFace, piece.position]);

  useFrame((_, delta) => {
    timeRef.current += delta;

    if (meshRef.current) {
      // Smoothly interpolate current rotation to target rotation
      currentRotation.current = currentRotation.current.map((curr, i) => {
        const target = targetRotation.current[i];
        return MathUtils.lerp(curr, target, ROTATION_SPEED);
      }) as [number, number, number];

      // Smoothly interpolate current offset to target offset
      currentOffset.current = currentOffset.current.map((curr, i) => {
        const target = targetOffset.current[i];
        return MathUtils.lerp(curr, target, ROTATION_SPEED);
      }) as [number, number, number];

      meshRef.current.rotation.setFromVector3(
        new Vector3(
          currentRotation.current[0],
          currentRotation.current[1],
          currentRotation.current[2]
        )
      );

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
      <meshStandardMaterial color={colors.right} emissive={colors.right} emissiveIntensity={getEmissive(selectedFace, [1, position[1], position[2]], timeRef.current)} attach="material-0" />
      <meshStandardMaterial color={colors.left} emissive={colors.left} emissiveIntensity={getEmissive(selectedFace, [-1, position[1], position[2]], timeRef.current)} attach="material-1" />
      <meshStandardMaterial color={colors.top} emissive={colors.top} emissiveIntensity={getEmissive(selectedFace, [position[0], 1, position[2]], timeRef.current)} attach="material-2" />
      <meshStandardMaterial color={colors.bottom} emissive={colors.bottom} emissiveIntensity={getEmissive(selectedFace, [position[0], -1, position[2]], timeRef.current)} attach="material-3" />
      <meshStandardMaterial color={colors.front} emissive={colors.front} emissiveIntensity={getEmissive(selectedFace, [position[0], position[1], 1], timeRef.current)} attach="material-4" />
      <meshStandardMaterial color={colors.back} emissive={colors.back} emissiveIntensity={getEmissive(selectedFace, [position[0], position[1], -1], timeRef.current)} attach="material-5" />
    </mesh>
  );
} 