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
    <div className="relative w-full h-full min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Bar: Title & Scene Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-medium text-slate-200 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-semibold text-white">3D Vehicle & Rider Geometry</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">Co-DETR Detection Space</span>
        </div>

        {/* Scene Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 text-xs shadow-lg">
          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            title="Toggle Auto Rotation"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              autoRotate
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan</span>
          </button>

          <button
            onClick={handleResetCamera}
            title="Reset View"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] text-slate-400 border border-slate-800 shadow-md">
        <Eye className="w-3.5 h-3.5 text-blue-400" />
        <span>Drag to rotate • Scroll to zoom • 3D Spatial BBox Sensor</span>
      </div>

      {/* 3D Canvas with Cyber Dark Background & Dramatic Lighting */}
      <Canvas
        camera={{ position: [3.6, 2.1, 3.6], fov: 38 }}
        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing"
      >
        {/* Dark Cyber Background */}
        <color attach="background" args={['#070A12']} />

        {/* Dramatic Cyber Studio Lighting */}
        <ambientLight intensity={0.8} color="#94A3B8" />

        {/* Directional Key Light */}
        <directionalLight position={[6, 8, 5]} intensity={2.0} color="#FFFFFF" castShadow />

        {/* Electric Blue Fill Light */}
        <directionalLight position={[-5, 4, 3]} intensity={1.5} color="#3B82F6" />

        {/* Purple/Cyan Rim Light */}
        <directionalLight position={[2, 3, -6]} intensity={1.8} color="#8B5CF6" />

        {/* Platform Downlight */}
        <pointLight position={[0, 4, 0]} intensity={1.5} color="#60A5FA" distance={10} />

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
