'use client';

import { useRef, useEffect } from 'react';
import { Mesh, Euler, MathUtils, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { CubePiece as CubePieceType } from '@/app/store/cubeStore';

interface CubePieceProps {
  piece: CubePieceType;
}

const PIECE_SIZE = 0.95; // Slightly smaller than 1 to create gaps between pieces
const ROTATION_SPEED = 0.15; // Speed of rotation animation

export default function CubePiece({ piece }: CubePieceProps) {
  const meshRef = useRef<Mesh>(null);
  const targetRotation = useRef<[number, number, number]>([0, 0, 0]);
  const currentRotation = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    targetRotation.current = piece.rotation;
  }, [piece.rotation]);

  useFrame(() => {
    if (meshRef.current) {
      // Smoothly interpolate current rotation to target rotation
      currentRotation.current = currentRotation.current.map((curr, i) => {
        const target = targetRotation.current[i];
        return MathUtils.lerp(curr, target, ROTATION_SPEED);
      }) as [number, number, number];

      meshRef.current.rotation.setFromVector3(
        new Vector3(
          currentRotation.current[0],
          currentRotation.current[1],
          currentRotation.current[2]
        )
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
      <meshStandardMaterial color={colors.right} attach="material-0" />
      <meshStandardMaterial color={colors.left} attach="material-1" />
      <meshStandardMaterial color={colors.top} attach="material-2" />
      <meshStandardMaterial color={colors.bottom} attach="material-3" />
      <meshStandardMaterial color={colors.front} attach="material-4" />
      <meshStandardMaterial color={colors.back} attach="material-5" />
    </mesh>
  );
} 