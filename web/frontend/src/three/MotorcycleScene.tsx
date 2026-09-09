import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
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
  const scanRingRef = useRef<THREE.Group>(null);
  const outerRadarRef = useRef<THREE.Mesh>(null);
  const innerRadarRef = useRef<THREE.Mesh>(null);
  const frontWheelRef = useRef<THREE.Group>(null);
  const rearWheelRef = useRef<THREE.Group>(null);

  // Colors
  const neonCyan = '#00E5FF';
  const neonGreen = '#00FF9C';

  const violationRed = '#FF3158';
  const activeColor = highlightViolation ? violationRed : neonCyan;

  // Animation loop
  useFrame((state, delta) => {
    // Subtle breathing floating motion
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.8) * 0.04;
    }

    // Holographic vertical laser scan beam
    if (scanRingRef.current && isScanning) {
      scanRingRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.2) * 1.2 + 1.0;
    }

    // Concentric scanning platform radar rotation
    if (outerRadarRef.current) {
      outerRadarRef.current.rotation.z += delta * 0.35;
    }
    if (innerRadarRef.current) {
      innerRadarRef.current.rotation.z -= delta * 0.55;
    }

    // Wheel spin
    if (frontWheelRef.current && rearWheelRef.current) {
      frontWheelRef.current.rotation.x += delta * 2.2;
      rearWheelRef.current.rotation.x += delta * 2.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.65, 0]}>
      {/* ================= FLOATING CYBER PARTICLES ================= */}
      <Sparkles
        count={65}
        scale={[6, 4, 6]}
        size={2.8}
        speed={0.4}
        color={highlightViolation ? '#FF3158' : '#00E5FF'}
        opacity={0.8}
      />

      {/* ================= SCANNING CHAMBER PLATFORM ================= */}
      {/* Main Elevated Holographic Platform Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <cylinderGeometry args={[3.2, 3.4, 0.12, 48]} />
        <meshStandardMaterial
          color="#081022"
          roughness={0.25}
          metalness={0.9}
        />
      </mesh>

      {/* Outer Neon Cyan Platform Border Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[3.12, 3.22, 64]} />
        <meshBasicMaterial color="#00E5FF" side={THREE.DoubleSide} />
      </mesh>

      {/* Rotating Outer Radar Ring */}
      <mesh ref={outerRadarRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[2.2, 2.26, 48]} />
        <meshBasicMaterial color="#00FF9C" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Rotating Inner Radar Ring */}
      <mesh ref={innerRadarRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.35, 1.4, 32]} />
        <meshBasicMaterial color="#1687FF" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Concentric AI Target Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <ringGeometry args={[0.7, 0.74, 32]} />
        <meshBasicMaterial color="#B44CFF" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Platform Cyber Grid */}
      <gridHelper args={[6.4, 24, '#00E5FF', '#11254A']} position={[0, 0.015, 0]} />

      {/* ================= VERTICAL HOLOGRAPHIC SCAN BEAM ================= */}
      {isScanning && (
        <group ref={scanRingRef} position={[0, 1.0, 0]}>
          {/* Glowing laser line plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.6, 2.0]} />
            <meshBasicMaterial
              color={activeColor}
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
              wireframe
            />
          </mesh>
          {/* Laser beam edge ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.7, 1.76, 48]} />
            <meshBasicMaterial color={activeColor} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* ================= MOTORCYCLE GEOMETRY ================= */}
      {/* 1. Main High-Gloss Metallic Chassis Frame */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.34, 0.42, 1.55]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.95}
          roughness={0.15}
        />
      </mesh>

      {/* Neon Underglow Strip */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.26, 0.03, 1.3]} />
        <meshBasicMaterial color={activeColor} />
      </mesh>

      {/* 2. Sculpted Aerodynamic Fuel Tank (Vibrant Cyber Blue with Neon Piping) */}
      <mesh position={[0, 1.02, 0.22]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.44, 0.38, 0.8]} />
        <meshStandardMaterial
          color="#0F2B5C"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Tank Illuminated Neon Accent Edges */}
      <mesh position={[0.23, 1.03, 0.22]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.025, 0.05, 0.78]} />
        <meshBasicMaterial color={activeColor} />
      </mesh>
      <mesh position={[-0.23, 1.03, 0.22]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.025, 0.05, 0.78]} />
        <meshBasicMaterial color={activeColor} />
      </mesh>

      {/* 3. Contoured Ergonomic Rider Seat */}
      <mesh position={[0, 0.96, -0.45]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[0.34, 0.15, 0.65]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.99, -0.74]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.28, 0.12, 0.25]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* 4. Chrome Engine Block & Detailed Cooling Fins */}
      <group position={[0, 0.52, 0.05]}>
        <mesh>
          <boxGeometry args={[0.38, 0.38, 0.6]} />
          <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.2} />
        </mesh>
        {/* Engine side metallic plate */}
        <mesh position={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.04, 24]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.98} roughness={0.1} />
        </mesh>
        <mesh position={[-0.2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.04, 24]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.98} roughness={0.1} />
        </mesh>
      </group>

      {/* 5. Chrome Curved Exhaust Pipe & Glowing Tip */}
      <group position={[0.23, 0.42, -0.55]} rotation={[0.12, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.055, 0.075, 0.9, 20]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.98} roughness={0.08} />
        </mesh>
        {/* Glowing Exhaust Tip */}
        <mesh position={[0, -0.46, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.05, 20]} />
          <meshBasicMaterial color="#00E5FF" />
        </mesh>
      </group>

      {/* 6. Front Fork, Handlebars & Wind Visor */}
      <group position={[0, 0.7, 0.92]} rotation={[-0.38, 0, 0]}>
        {/* Fork Left Chrome */}
        <mesh position={[0.14, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.15, 20]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.98} roughness={0.1} />
        </mesh>
        {/* Fork Right Chrome */}
        <mesh position={[-0.14, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.15, 20]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.98} roughness={0.1} />
        </mesh>

        {/* Handlebars with Ergonomic Grips */}
        <mesh position={[0, 0.58, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.024, 0.024, 0.88, 20]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Grip Left */}
        <mesh position={[0.42, 0.58, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.12, 16]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>
        {/* Grip Right */}
        <mesh position={[-0.42, 0.58, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.12, 16]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>

        {/* Aerodynamic Front Cowl & Wind Visor */}
        <mesh position={[0, 0.65, 0.08]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.3, 0.28, 0.14]} />
          <meshStandardMaterial color="#0F2B5C" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.8, 0.08]} rotation={[0.4, 0, 0]}>
          <planeGeometry args={[0.26, 0.18]} />
          <meshPhysicalMaterial
            color="#00E5FF"
            transmission={0.7}
            opacity={0.85}
            transparent
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* 7. Dual High-Intensity Headlights with Volumetric Beam Projection */}
      <group position={[0, 0.98, 1.1]}>
        <mesh position={[0.08, 0, 0]}>
          <sphereGeometry args={[0.075, 20, 20]} />
          <meshBasicMaterial color="#00E5FF" />
        </mesh>
        <mesh position={[-0.08, 0, 0]}>
          <sphereGeometry args={[0.075, 20, 20]} />
          <meshBasicMaterial color="#00E5FF" />
        </mesh>
        {/* Volumetric Spot Light projection forward */}
        <spotLight
          position={[0, 0, 0.1]}
          target-position={[0, 0.2, 4.5]}
          angle={0.5}
          penumbra={0.6}
          intensity={4.5}
          color="#00E5FF"
          distance={8}
        />
      </group>

      {/* Rear High-Intensity LED Tail Light */}
      <mesh position={[0, 0.88, -0.92]}>
        <boxGeometry args={[0.18, 0.06, 0.04]} />
        <meshBasicMaterial color="#FF3158" />
      </mesh>

      {/* ================= WHEELS & TIRES ================= */}
      {/* Front Wheel */}
      <group ref={frontWheelRef} position={[0, 0.42, 1.15]}>
        {/* Treaded Tire */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.42, 0.095, 20, 36]} />
          <meshStandardMaterial color="#0A0F1D" roughness={0.85} metalness={0.2} />
        </mesh>
        {/* High-Contrast Metallic Rim */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.33, 0.33, 0.07, 28]} />
          <meshStandardMaterial color="#1E293B" metalness={0.98} roughness={0.1} />
        </mesh>
        {/* Bright Glowing Cyan Wheel Ring */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.28, 0.02, 16, 36]} />
          <meshBasicMaterial color="#00E5FF" />
        </mesh>
        {/* Secondary Inner Green Accent */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.18, 0.015, 16, 36]} />
          <meshBasicMaterial color="#00FF9C" />
        </mesh>
      </group>

      {/* Rear Wheel */}
      <group ref={rearWheelRef} position={[0, 0.42, -1.05]}>
        {/* Treaded Tire */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.42, 0.11, 20, 36]} />
          <meshStandardMaterial color="#0A0F1D" roughness={0.85} metalness={0.2} />
        </mesh>
        {/* High-Contrast Metallic Rim */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.31, 0.31, 0.09, 28]} />
          <meshStandardMaterial color="#1E293B" metalness={0.98} roughness={0.1} />
        </mesh>
        {/* Bright Glowing Cyan Wheel Ring */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.26, 0.02, 16, 36]} />
          <meshBasicMaterial color="#00E5FF" />
        </mesh>
      </group>

      {/* ================= DETAILED RIDER WITH SMART HELMET ================= */}
      <group position={[0, 1.05, -0.2]}>
        {/* Rider Legs resting on motorcycle footpegs */}
        <mesh position={[0.24, -0.05, 0.08]} rotation={[0.8, 0.15, -0.2]}>
          <cylinderGeometry args={[0.07, 0.06, 0.55, 16]} />
          <meshStandardMaterial color="#091024" roughness={0.6} metalness={0.4} />
        </mesh>
        <mesh position={[-0.24, -0.05, 0.08]} rotation={[0.8, -0.15, 0.2]}>
          <cylinderGeometry args={[0.07, 0.06, 0.55, 16]} />
          <meshStandardMaterial color="#091024" roughness={0.6} metalness={0.4} />
        </mesh>

        {/* Lower Torso / Hip */}
        <mesh position={[0, 0.12, -0.12]} rotation={[0.38, 0, 0]}>
          <boxGeometry args={[0.34, 0.32, 0.28]} />
          <meshStandardMaterial color="#0B132B" roughness={0.5} metalness={0.5} />
        </mesh>

        {/* Main Torso / Cyber Riding Jacket */}
        <mesh position={[0, 0.38, 0.06]} rotation={[0.48, 0, 0]}>
          <boxGeometry args={[0.4, 0.46, 0.32]} />
          <meshStandardMaterial color="#0F172A" roughness={0.5} metalness={0.6} />
        </mesh>

        {/* Jacket Illuminated Neon Spine Strip */}
        <mesh position={[0, 0.42, -0.1]} rotation={[0.48, 0, 0]}>
          <boxGeometry args={[0.04, 0.42, 0.02]} />
          <meshBasicMaterial color={activeColor} />
        </mesh>

        {/* Rider Arms extending naturally to the handlebars */}
        <mesh position={[0.25, 0.38, 0.34]} rotation={[0.75, 0.22, -0.32]}>
          <cylinderGeometry args={[0.055, 0.05, 0.52, 16]} />
          <meshStandardMaterial color="#1E293B" roughness={0.5} />
        </mesh>
        <mesh position={[-0.25, 0.38, 0.34]} rotation={[0.75, -0.22, 0.32]}>
          <cylinderGeometry args={[0.055, 0.05, 0.52, 16]} />
          <meshStandardMaterial color="#1E293B" roughness={0.5} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.65, 0.22]} rotation={[0.32, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.14, 20]} />
          <meshStandardMaterial color="#334155" roughness={0.4} />
        </mesh>

        {/* ================= SMART HELMET ================= */}
        <group position={[0, 0.85, 0.28]} rotation={[0.18, 0, 0]}>
          {/* Main Helmet Shell (Vibrant Gloss Cyber White / Teal) */}
          <mesh>
            <sphereGeometry args={[0.24, 28, 28]} />
            <meshStandardMaterial
              color={highlightViolation ? '#500715' : '#E2E8F0'}
              metalness={0.7}
              roughness={0.15}
            />
          </mesh>

          {/* Chin Guard */}
          <mesh position={[0, -0.07, 0.14]}>
            <boxGeometry args={[0.22, 0.13, 0.16]} />
            <meshStandardMaterial
              color={highlightViolation ? '#2B040B' : '#0F172A'}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>

          {/* Glowing Smart Visor (HUD Scan Shield) */}
          <mesh position={[0, 0.03, 0.18]} rotation={[-0.08, 0, 0]}>
            <boxGeometry args={[0.26, 0.11, 0.1]} />
            <meshBasicMaterial color={highlightViolation ? violationRed : neonGreen} />
          </mesh>

          {/* Top Aerodynamic Cyber Fin */}
          <mesh position={[0, 0.14, -0.08]} rotation={[-0.32, 0, 0]}>
            <boxGeometry args={[0.05, 0.07, 0.22]} />
            <meshBasicMaterial color={activeColor} />
          </mesh>
        </group>
      </group>

      {/* ================= 3D HOLOGRAPHIC WORLD-SPACE HUD ================= */}
      {/* 1. Rider Detection Holographic HUD Box */}
      <Html position={[0.75, 1.95, 0.2]} center distanceFactor={6}>
        <div className="select-none pointer-events-none whitespace-nowrap bg-[#060B19]/90 backdrop-blur-xl border-2 border-[#00FF9C] rounded-xl px-3.5 py-2 shadow-neon-green text-xs font-mono transform scale-85 sm:scale-100 origin-center">
          <div className="flex items-center gap-2 font-black tracking-wider text-[#00FF9C]">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00FF9C] animate-ping" />
            <span className="text-glow-green">RIDER [DRIVER]</span>
          </div>
          <div className="text-slate-200 mt-1 font-semibold flex items-center justify-between gap-3">
            <span>Helmet Status:</span>
            <span className={highlightViolation ? 'text-[#FF3158] font-bold text-glow-red' : 'text-[#00FF9C] font-bold text-glow-green'}>
              {highlightViolation ? 'VIOLATION (NO HELMET)' : 'DETECTED'}
            </span>
          </div>
          <div className="text-slate-400 text-[11px] flex items-center justify-between gap-2 mt-0.5">
            <span>Confidence:</span>
            <span className="text-[#00E5FF] font-bold text-glow-cyan">96.8%</span>
          </div>
        </div>
      </Html>

      {/* 2. Motorcycle Detection Holographic HUD Box */}
      <Html position={[-0.85, 0.9, 0.9]} center distanceFactor={6}>
        <div className="select-none pointer-events-none whitespace-nowrap bg-[#060B19]/90 backdrop-blur-xl border-2 border-[#00E5FF] rounded-xl px-3.5 py-2 shadow-neon-cyan text-xs font-mono transform scale-85 sm:scale-100 origin-center">
          <div className="flex items-center gap-2 font-black tracking-wider text-[#00E5FF]">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00E5FF]" />
            <span className="text-glow-cyan">MOTORCYCLE #03</span>
          </div>
          <div className="text-slate-200 mt-1 font-semibold flex items-center justify-between gap-3">
            <span>Class:</span>
            <span className="text-white font-bold">Two-Wheeler</span>
          </div>
          <div className="text-slate-400 text-[11px] flex items-center justify-between gap-2 mt-0.5">
            <span>Confidence:</span>
            <span className="text-[#00FF9C] font-bold text-glow-green">98.2%</span>
          </div>
        </div>
      </Html>

      {/* 3D Wireframe AI Bounding Box around helmet */}
      <mesh position={[0, 1.88, 0.08]}>
        <boxGeometry args={[0.62, 0.62, 0.62]} />
        <meshBasicMaterial
          color={activeColor}
          wireframe
          transparent
          opacity={0.45}
        />
      </mesh>
    </group>
  );
};
