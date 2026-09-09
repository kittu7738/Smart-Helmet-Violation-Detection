import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { MotorcycleScene } from './MotorcycleScene';
import { RotateCw, Scan, Eye, Compass, ShieldCheck } from 'lucide-react';

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
    <div className="relative w-full h-full min-h-[420px] sm:min-h-[480px] lg:min-h-[540px] rounded-2xl overflow-hidden neon-glass-panel border-2 border-[#00E5FF]/40 shadow-[0_0_35px_rgba(0,229,255,0.25)]">
      {/* Top HUD bar with Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        <div className="flex items-center gap-2.5 bg-[#060B19]/90 backdrop-blur-xl px-4 py-2 rounded-xl border border-[#00E5FF]/50 text-xs font-mono text-[#00E5FF] shadow-neon-cyan">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF9C] animate-ping" />
          <span className="font-bold tracking-wider text-glow-cyan">3D DIGITAL TWIN SCANNER</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-[#00FF9C] font-semibold hidden sm:inline">CO-DETR GEOMETRY</span>
        </div>

        {/* Interactive Scene Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#060B19]/90 backdrop-blur-xl p-1.5 rounded-xl border border-[#00E5FF]/40 text-xs shadow-lg">
          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            title="Toggle Auto Rotation"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold font-mono transition-all duration-200 ${
              autoRotate
                ? 'bg-[#00E5FF]/25 text-[#00E5FF] border border-[#00E5FF] shadow-neon-cyan'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Rotate</span>
          </button>

          <button
            onClick={() => setIsScanning((prev) => !prev)}
            title="Toggle AI Scan Beam"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold font-mono transition-all duration-200 ${
              isScanning
                ? 'bg-[#00FF9C]/25 text-[#00FF9C] border border-[#00FF9C] shadow-neon-green'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan</span>
          </button>

          <button
            onClick={handleResetCamera}
            title="Reset Camera View"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all font-mono"
          >
            <Compass className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Bottom instructions helper */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex items-center gap-2 bg-[#060B19]/85 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-300 border border-[#00E5FF]/30 shadow-md">
        <Eye className="w-3.5 h-3.5 text-[#00E5FF] animate-pulse" />
        <span>Drag to orbit • Scroll to zoom • Touch interactive</span>
      </div>

      {/* Bottom Right Live Telemetry Chip */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden sm:flex items-center gap-2 bg-[#060B19]/85 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-mono text-[#00FF9C] border border-[#00FF9C]/40">
        <ShieldCheck className="w-3.5 h-3.5 text-[#00FF9C]" />
        <span>3D SHADER ACTIVE • 60 FPS</span>
      </div>

      {/* 3D Canvas with High-Intensity Futuristic Lighting */}
      <Canvas
        camera={{ position: [3.8, 2.4, 3.8], fov: 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Background Color: Deep cosmic night */}
        <color attach="background" args={['#040711']} />

        {/* Powerful Multi-Point Lights */}
        {/* 1. Purple / Violet Ambient Light */}
        <ambientLight intensity={1.3} color="#B44CFF" />

        {/* 2. High-Intensity Directional Key Light (Top-Front) */}
        <directionalLight position={[6, 9, 6]} intensity={3.5} color="#FFFFFF" />

        {/* 3. Intense Electric Cyan Accent Light */}
        <directionalLight position={[-6, 4, -4]} intensity={3.0} color="#00E5FF" />

        {/* 4. Deep Neon Blue Rim Light */}
        <directionalLight position={[0, -2, -6]} intensity={2.5} color="#1687FF" />

        {/* 5. Center Point Light for platform illumination */}
        <pointLight position={[0, 4, 0]} intensity={3.2} color="#00E5FF" distance={12} />

        {/* 6. Green Secondary Accent Light */}
        <pointLight position={[0, 1.5, 2.5]} intensity={2.0} color="#00FF9C" distance={6} />

        <Suspense fallback={null}>
          <Float speed={1.4} rotationIntensity={0.08} floatIntensity={0.15}>
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
          minDistance={2.4}
          maxDistance={7.5}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.05}
          autoRotate={autoRotate}
          autoRotateSpeed={1.2}
          enableDamping
          dampingFactor={0.06}
        />
      </Canvas>
    </div>
  );
};
