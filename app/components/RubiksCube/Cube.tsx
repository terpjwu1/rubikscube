'use client';

import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useCubeStore } from '@/app/store/cubeStore';
import CubePiece from './CubePiece';

export default function Cube() {
  const { pieces, initializeCube } = useCubeStore();

  useEffect(() => {
    initializeCube();
  }, [initializeCube]);

  return (
    <div className="w-full h-[80vh]">
      <Canvas camera={{ position: [8, 8, 8], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <group scale={1.5}>
          {pieces.map((piece, index) => (
            <CubePiece key={index} piece={piece} />
          ))}
        </group>
        <OrbitControls 
          enablePan={false}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
} 