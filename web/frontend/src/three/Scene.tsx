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
    <div className="relative w-full h-full min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm flex flex-col">
      {/* Top Bar: Title & Scene Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="font-semibold text-slate-900">3D Vehicle & Rider Model</span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500 text-[11px] hidden sm:inline">Co-DETR Detection Space</span>
        </div>

        {/* Clean Controls (White buttons) */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur-md p-1 rounded-lg border border-slate-200 text-xs shadow-sm">
          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            title="Toggle Auto Rotation"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              autoRotate
                ? 'bg-blue-50 text-blue-600 border border-blue-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                ? 'bg-green-50 text-green-700 border border-green-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan</span>
          </button>

          <button
            onClick={handleResetCamera}
            title="Reset View"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] text-slate-500 border border-slate-200 shadow-sm">
        <Eye className="w-3.5 h-3.5 text-blue-600" />
        <span>Drag to rotate • Scroll to zoom • 3/4 perspective</span>
      </div>

      {/* 3D Canvas with Light Background & Studio Lighting */}
      <Canvas
        camera={{ position: [3.6, 2.1, 3.6], fov: 38 }}
        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing"
      >
        {/* Clean Light Background */}
        <color attach="background" args={['#F8FAFC']} />

        {/* Studio Lighting for Crisp Definition */}
        {/* Soft Ambient Fill */}
        <ambientLight intensity={1.8} color="#FFFFFF" />

        {/* Directional Key Light */}
        <directionalLight position={[6, 8, 5]} intensity={2.4} color="#FFFFFF" castShadow />

        {/* Fill Light from Left */}
        <directionalLight position={[-5, 4, 3]} intensity={1.6} color="#E0F2FE" />

        {/* Subtle Blue Rim Light */}
        <directionalLight position={[2, 3, -6]} intensity={1.4} color="#93C5FD" />

        {/* Platform Downlight */}
        <pointLight position={[0, 4, 0]} intensity={1.8} color="#FFFFFF" distance={10} />

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
