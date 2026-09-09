import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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
    <div className="relative w-full h-full min-h-[500px] sm:min-h-[560px] lg:min-h-[640px] xl:min-h-[680px] rounded-2xl overflow-hidden neon-glass-panel border-2 border-[#00E5FF]/45 shadow-[0_0_40px_rgba(0,229,255,0.25)] flex flex-col">
      {/* Top HUD Bar with Controls & Live Pipeline Status */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2.5 bg-[#060B19]/95 backdrop-blur-2xl px-4 py-2 rounded-xl border-2 border-[#00E5FF]/50 text-xs font-mono text-[#00E5FF] shadow-neon-cyan">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF9C] shadow-neon-green animate-ping" />
          <span className="font-black tracking-wider text-glow-cyan">3D DIGITAL TWIN SCANNER</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-[#00FF9C] font-bold hidden sm:inline">CO-DETR GEOMETRY HERO</span>
        </div>

        {/* Interactive Scene Action Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#060B19]/95 backdrop-blur-2xl p-1.5 rounded-xl border-2 border-[#00E5FF]/40 text-xs shadow-lg">
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

      {/* Bottom Left Touch Controls Guide */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex items-center gap-2 bg-[#060B19]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-mono text-slate-200 border border-[#00E5FF]/40 shadow-md">
        <Eye className="w-3.5 h-3.5 text-[#00E5FF] animate-pulse" />
        <span>Orbit: Left-Drag • Zoom: Scroll/Pinch • Hero 3/4 View</span>
      </div>

      {/* Bottom Right Live Telemetry Chip */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden sm:flex items-center gap-2 bg-[#060B19]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-mono text-[#00FF9C] border border-[#00FF9C]/50 shadow-neon-green">
        <ShieldCheck className="w-3.5 h-3.5 text-[#00FF9C]" />
        <span>3D SHADER ACTIVE • 60 FPS</span>
      </div>

      {/* 3D Canvas with High-Intensity Cinematic Lighting & Tight Hero Framing */}
      <Canvas
        camera={{ position: [3.7, 2.2, 3.7], fov: 38 }}
        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing"
      >
        {/* Background Color: Deep cosmic night */}
        <color attach="background" args={['#030712']} />

        {/* Powerful Multi-Point Cinematic Lights */}
        {/* 1. Purple / Violet Ambient Light */}
        <ambientLight intensity={1.4} color="#6B21A8" />

        {/* 2. Intense White Key Light (Top-Front Right) */}
        <directionalLight position={[6, 9, 6]} intensity={3.8} color="#FFFFFF" />

        {/* 3. Intense Electric Cyan Accent Light (Left-Front) */}
        <directionalLight position={[-5, 4, 3]} intensity={3.2} color="#00E5FF" />

        {/* 4. Deep Neon Blue Rim Light (Back-Side) */}
        <directionalLight position={[2, 3, -6]} intensity={3.0} color="#1687FF" />

        {/* 5. Center Point Light directly illuminating the bike and platform */}
        <pointLight position={[0, 4.2, 0]} intensity={4.2} color="#00E5FF" distance={14} />

        {/* 6. Green Secondary Accent Light on rider front */}
        <pointLight position={[0, 1.8, 3.0]} intensity={2.4} color="#00FF9C" distance={8} />

        <Suspense fallback={null}>
          <MotorcycleScene
            isScanning={isScanning}
            highlightViolation={highlightViolation}
          />
        </Suspense>

        {/* Orbit Controls with Centered Target on the Motorcycle Engine/Rider */}
        <OrbitControls
          ref={controlsRef}
          target={[0, 1.15, 0]}
          enablePan={false}
          minDistance={2.0}
          maxDistance={7.0}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.05}
          autoRotate={autoRotate}
          autoRotateSpeed={0.9}
          enableDamping
          dampingFactor={0.06}
        />
      </Canvas>
    </div>
  );
};
