'use client';

import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CitationGateScene, CitationGateSceneProps } from './CitationGateScene';

export function CitationGateCanvas(props: CitationGateSceneProps) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{
          position: [0, 2.2, 5.2],
          fov: 40,
          near: 0.1,
          far: 50,
        }}
        shadows
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
      >
        <color attach="background" args={['#241b16']} />
        <CitationGateScene {...props} />
      </Canvas>
    </div>
  );
}
