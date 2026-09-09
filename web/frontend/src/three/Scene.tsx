import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
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
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] rounded-xl overflow-hidden glass-panel border border-cyan-500/20 shadow-2xl">
      {/* Top HUD bar with Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs font-mono text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-semibold tracking-wide">3D DIGITAL TWIN SCANNER</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">CO-DETR GEOMETRY</span>
        </div>

        {/* Interactive Scene Toggles */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/80 backdrop-blur-md p-1 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            title="Toggle Auto Rotation"
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
              autoRotate
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Rotate</span>
          </button>

          <button
            onClick={() => setIsScanning((prev) => !prev)}
            title="Toggle AI Scan Ring"
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all ${
              isScanning
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Scan</span>
          </button>

          <button
            onClick={handleResetCamera}
            title="Reset Camera View"
            className="flex items-center gap-1 px-2.5 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Bottom instructions helper */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] font-mono text-slate-400 border border-slate-800">
        <Eye className="w-3 h-3 text-cyan-400" />
        <span>Drag to orbit • Scroll to zoom • Touch interactive</span>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [3.8, 2.5, 3.8], fov: 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Environment & Ambient Lighting */}
        <color attach="background" args={['#060a12']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-5, 3, -5]} intensity={0.6} color="#00f2fe" />
        <pointLight position={[0, 4, 0]} intensity={1.2} color="#00f2fe" distance={10} />

        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.15}>
            <MotorcycleScene
              isScanning={isScanning}
              highlightViolation={highlightViolation}
            />
          </Float>
        </Suspense>

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={2.5}
          maxDistance={7.5}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.05}
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
          enableDamping
          dampingFactor={0.06}
        />
      </Canvas>
    </div>
  );
};
