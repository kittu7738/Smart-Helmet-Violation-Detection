import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface MotorcycleSceneProps {
  isScanning?: boolean;
  highlightViolation?: boolean;
}

export const MotorcycleScene: React.FC<MotorcycleSceneProps> = ({
  isScanning = true,
  highlightViolation = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const scanRingRef = useRef<THREE.Mesh>(null);
  const radarRingRef = useRef<THREE.Mesh>(null);
  const frontWheelRef = useRef<THREE.Group>(null);
  const rearWheelRef = useRef<THREE.Group>(null);

  // Animation loop
  useFrame((state, delta) => {
    // Gentle floating & auto-rotation
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
    }

    // Holographic scanning plane animation
    if (scanRingRef.current && isScanning) {
      scanRingRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 1.1 + 0.9;
    }

    // Rotating ground radar ring
    if (radarRingRef.current) {
      radarRingRef.current.rotation.z += delta * 0.4;
    }

    // Wheel spin
    if (frontWheelRef.current && rearWheelRef.current) {
      frontWheelRef.current.rotation.x += delta * 1.5;
      rearWheelRef.current.rotation.x += delta * 1.5;
    }
  });

  const neonTeal = '#00f2fe';
  const violationRed = '#ef4444';
  const activeColor = highlightViolation ? violationRed : neonTeal;

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      {/* ================= GROUND PLATFORM & RADAR ================= */}
      {/* Ground Cyber Hexagon / Disk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <cylinderGeometry args={[2.8, 3.0, 0.1, 32]} />
        <meshStandardMaterial
          color="#0d1527"
          roughness={0.7}
          metalness={0.8}
        />
      </mesh>

      {/* Outer Glow Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[2.7, 2.78, 48]} />
        <meshBasicMaterial color="#00f2fe" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Rotating Radar Rings */}
      <mesh ref={radarRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.5, 1.54, 32]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Secondary Concentric Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[0.8, 0.83, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Ground Grid Pattern */}
      <gridHelper args={[6, 20, '#00f2fe', '#13233f']} position={[0, 0.01, 0]} />

      {/* ================= VERTICAL HOLOGRAPHIC SCAN BEAM ================= */}
      {isScanning && (
        <mesh ref={scanRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.9, 0]}>
          <planeGeometry args={[3.2, 1.8]} />
          <meshBasicMaterial
            color={activeColor}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            wireframe
          />
        </mesh>
      )}

      {/* ================= MOTORCYCLE BODY ================= */}
      {/* Main Chassis / Frame */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.3, 0.35, 1.4]} />
        <meshStandardMaterial color="#111827" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Sleek Fuel Tank */}
      <mesh position={[0, 0.92, 0.15]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.38, 0.32, 0.7]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>

      {/* Fuel Tank Neon Accent Lines */}
      <mesh position={[0.2, 0.92, 0.15]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.02, 0.04, 0.65]} />
        <meshBasicMaterial color={activeColor} />
      </mesh>
      <mesh position={[-0.2, 0.92, 0.15]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.02, 0.04, 0.65]} />
        <meshBasicMaterial color={activeColor} />
      </mesh>

      {/* Seat */}
      <mesh position={[0, 0.88, -0.45]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.32, 0.12, 0.6]} />
        <meshStandardMaterial color="#030712" roughness={0.9} />
      </mesh>

      {/* Engine Block */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.34, 0.35, 0.55]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Exhaust Pipe */}
      <mesh position={[0.2, 0.38, -0.55]} rotation={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.8, 16]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Front Fork & Steering */}
      <group position={[0, 0.6, 0.85]} rotation={[-0.35, 0, 0]}>
        {/* Fork Left */}
        <mesh position={[0.12, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 1.0, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Fork Right */}
        <mesh position={[-0.12, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 1.0, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Handlebars */}
        <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.75, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
      </group>

      {/* Front Headlight Housing & Neon Glow */}
      <mesh position={[0, 0.9, 0.95]}>
        <boxGeometry args={[0.18, 0.18, 0.15]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.9, 1.03]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#00f2fe" />
      </mesh>
      {/* Front Light Cone */}
      <spotLight
        position={[0, 0.9, 1.05]}
        target-position={[0, 0.1, 3.5]}
        angle={0.4}
        penumbra={0.5}
        intensity={2.5}
        color="#00f2fe"
        distance={6}
      />

      {/* Tail Light */}
      <mesh position={[0, 0.8, -0.85]}>
        <boxGeometry args={[0.15, 0.06, 0.04]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* ================= WHEELS ================= */}
      {/* Front Wheel */}
      <group ref={frontWheelRef} position={[0, 0.38, 1.05]}>
        {/* Tire */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.38, 0.085, 16, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        {/* Rim */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.06, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Rim Accent Ring */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.26, 0.015, 16, 32]} />
          <meshBasicMaterial color="#00f2fe" />
        </mesh>
        {/* Axle */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.22, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} />
        </mesh>
      </group>

      {/* Rear Wheel */}
      <group ref={rearWheelRef} position={[0, 0.38, -0.95]}>
        {/* Tire */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.38, 0.1, 16, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        {/* Rim */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.08, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Rim Accent Ring */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.24, 0.015, 16, 32]} />
          <meshBasicMaterial color="#00f2fe" />
        </mesh>
        {/* Axle */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.24, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} />
        </mesh>
      </group>

      {/* ================= RIDER & HELMET ================= */}
      <group position={[0, 0.95, -0.2]}>
        {/* Lower Torso / Pelvis */}
        <mesh position={[0, 0.1, -0.1]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.25]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>

        {/* Upper Torso leaning forward toward handlebars */}
        <mesh position={[0, 0.35, 0.08]} rotation={[0.45, 0, 0]}>
          <boxGeometry args={[0.36, 0.42, 0.28]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>

        {/* Rider Arms extending to handlebars */}
        <mesh position={[0.22, 0.35, 0.32]} rotation={[0.7, 0.2, -0.3]}>
          <cylinderGeometry args={[0.045, 0.045, 0.45, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        <mesh position={[-0.22, 0.35, 0.32]} rotation={[0.7, -0.2, 0.3]}>
          <cylinderGeometry args={[0.045, 0.045, 0.45, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.6, 0.22]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.12, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>

        {/* ================= SMART HELMET ================= */}
        <group position={[0, 0.78, 0.28]} rotation={[0.15, 0, 0]}>
          {/* Outer Helmet Shell */}
          <mesh>
            <sphereGeometry args={[0.22, 24, 24]} />
            <meshStandardMaterial
              color={highlightViolation ? '#7f1d1d' : '#042f2e'}
              metalness={0.6}
              roughness={0.2}
            />
          </mesh>

          {/* Helmet Chin Guard */}
          <mesh position={[0, -0.06, 0.12]}>
            <boxGeometry args={[0.2, 0.12, 0.14]} />
            <meshStandardMaterial
              color={highlightViolation ? '#450a0a' : '#0f172a'}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>

          {/* Futuristic Visor (HUD / Scan Glow) */}
          <mesh position={[0, 0.02, 0.16]} rotation={[-0.1, 0, 0]}>
            <boxGeometry args={[0.24, 0.09, 0.1]} />
            <meshStandardMaterial
              color={highlightViolation ? violationRed : '#00f2fe'}
              emissive={highlightViolation ? violationRed : '#00f2fe'}
              emissiveIntensity={0.6}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>

          {/* Helmet Aerodynamic Fin / Strip */}
          <mesh position={[0, 0.12, -0.08]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.04, 0.06, 0.2]} />
            <meshBasicMaterial color={activeColor} />
          </mesh>
        </group>
      </group>

      {/* ================= 3D HUD OVERLAYS / LABELS ================= */}
      {/* Rider / Helmet Detection Tag */}
      <Html position={[0.65, 1.85, 0.2]} center distanceFactor={6}>
        <div className="select-none pointer-events-none whitespace-nowrap bg-slate-950/80 backdrop-blur-md border border-cyan-500/50 rounded px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-lg shadow-cyan-500/20 text-[11px] sm:text-xs font-mono transform scale-80 sm:scale-100 origin-center">
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-cyan-400">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>RIDER [DRIVER]</span>
          </div>
          <div className="text-slate-300 mt-0.5">
            Helmet: <span className="text-emerald-400 font-semibold">DETECTED</span>
          </div>
          <div className="text-slate-400 text-[10px]">
            Confidence: <span className="text-cyan-300 font-semibold">96.8%</span>
          </div>
        </div>
      </Html>

      {/* Motorcycle Vehicle Detection Tag */}
      <Html position={[-0.75, 0.85, 0.8]} center distanceFactor={6}>
        <div className="select-none pointer-events-none whitespace-nowrap bg-slate-950/80 backdrop-blur-md border border-blue-500/50 rounded px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-lg shadow-blue-500/20 text-[11px] sm:text-xs font-mono transform scale-80 sm:scale-100 origin-center">
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-blue-400">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
            <span>MOTORCYCLE</span>
          </div>
          <div className="text-slate-300 mt-0.5">
            Class: <span className="text-slate-200">Two-Wheeler</span>
          </div>
          <div className="text-slate-400 text-[10px]">
            Confidence: <span className="text-blue-300 font-semibold">98.2%</span>
          </div>
        </div>
      </Html>


      {/* Simulated 3D Bounding Bracket Wireframe around Helmet */}
      <mesh position={[0, 1.73, 0.08]}>
        <boxGeometry args={[0.55, 0.55, 0.55]} />
        <meshBasicMaterial
          color={activeColor}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
};
