import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { MotorcycleScene } from './MotorcycleScene';
import { RotateCw, Scan, Eye, Compass } from 'lucide-react';

interface SceneProps {
  highlightViolation?: boolean;
}

export const Scene: React.FC<SceneProps> = ({ highlightViolation = false }) => {
  const [autoRotate, setAutoRotate] = useState(true);
  const [isScanning, setIsScanning] = useState(true);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[480px] sm:min-h-[540px] lg:min-h-[600px] rounded-xl overflow-hidden bg-slate-900/70 border border-slate-800 shadow-xl flex flex-col">
      {/* Top Bar: Title & Scene Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-white">3D Vehicle & Rider Model</span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">Co-DETR Detection Space</span>
        </div>

        {/* Clean Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            title="Toggle Auto Rotation"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              autoRotate
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Rotate</span>
          </button>

          <button
            onClick={() => setIsScanning((prev) => !prev)}
            title="Toggle Scan Line"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              isScanning
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan</span>
          </button>

          <button
            onClick={handleResetCamera}
            title="Reset View"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-md text-[11px] font-mono text-slate-400 border border-slate-800">
        <Eye className="w-3.5 h-3.5 text-sky-400" />
        <span>Drag to rotate • Scroll to zoom • Clean 3D view</span>
      </div>

      {/* 3D Canvas with Clean Studio Lighting */}
      <Canvas
        camera={{ position: [3.6, 2.1, 3.6], fov: 38 }}
        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing"
      >
        {/* Simple deep background */}
        <color attach="background" args={['#080e1a']} />

        {/* 1. Soft Ambient Light */}
        <ambientLight intensity={1.5} color="#cbd5e1" />

        {/* 2. Clean White Front Key Light */}
        <directionalLight position={[5, 7, 5]} intensity={2.8} color="#ffffff" />

        {/* 3. Blue/Cyan Rim Light for Crisp Silhouette */}
        <directionalLight position={[-4, 3, -4]} intensity={2.0} color="#38bdf8" />

        {/* 4. Platform Soft Center Light */}
        <pointLight position={[0, 4, 0]} intensity={2.5} color="#bae6fd" distance={10} />

        <Suspense fallback={null}>
          <MotorcycleScene
            isScanning={isScanning}
            highlightViolation={highlightViolation}
          />
        </Suspense>

        {/* Centered Controls */}
        <OrbitControls
          ref={controlsRef}
          target={[0, 1.0, 0]}
          enablePan={false}
          minDistance={2.0}
          maxDistance={7.0}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.05}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
          enableDamping
          dampingFactor={0.06}
        />
      </Canvas>
    </div>
  );
};
