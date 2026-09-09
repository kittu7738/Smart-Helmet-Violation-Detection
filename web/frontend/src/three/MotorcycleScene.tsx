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
  const scanRingRef = useRef<THREE.Group>(null);
  const radarRingRef = useRef<THREE.Mesh>(null);
  const frontWheelRef = useRef<THREE.Group>(null);
  const rearWheelRef = useRef<THREE.Group>(null);

  // Clean research status colors
  const primaryBlue = '#2563EB';
  const successGreen = '#16A34A';
  const dangerRed = '#DC2626';

  const helmetColor = highlightViolation ? dangerRed : successGreen;
  const accentColor = highlightViolation ? dangerRed : primaryBlue;

  // Frame animation
  useFrame((state, delta) => {
    // Gentle idle float
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.015;
    }

    // Clean scan sweep
    if (scanRingRef.current && isScanning) {
      scanRingRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.8) * 1.0 + 1.1;
    }

    // Subtle platform ring rotation
    if (radarRingRef.current) {
      radarRingRef.current.rotation.z += delta * 0.2;
    }

    // Wheel rotation
    if (frontWheelRef.current && rearWheelRef.current) {
      frontWheelRef.current.rotation.x += delta * 2.0;
      rearWheelRef.current.rotation.x += delta * 2.0;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      {/* ================= 1. CLEAN LIGHT PLATFORM ================= */}
      {/* Base platform (Clean White / Light Slate) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <cylinderGeometry args={[3.4, 3.5, 0.12, 48]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Subtle outer platform ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[3.34, 3.38, 48]} />
        <meshBasicMaterial color="#93C5FD" side={THREE.DoubleSide} />
      </mesh>

      {/* Single rotating detection ring */}
      <mesh ref={radarRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[2.2, 2.23, 36]} />
        <meshBasicMaterial color="#60A5FA" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Very light floor grid */}
      <gridHelper args={[6.4, 20, '#94A3B8', '#E2E8F0']} position={[0, 0.01, 0]} />

      {/* Clean vertical scan line */}
      {isScanning && (
        <group ref={scanRingRef} position={[0, 1.1, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.6, 1.8]} />
            <meshBasicMaterial
              color={accentColor}
              transparent
              opacity={0.08}
              side={THREE.DoubleSide}
              wireframe
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 1.83, 48]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* ================= 2. CLEAN 3D MOTORCYCLE ================= */}
      <group position={[0, 0, 0]}>

        {/* FRONT WHEEL ASSEMBLY */}
        <group ref={frontWheelRef} position={[0, 0.55, 1.35]}>
          {/* Tire (Dark Slate) */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.52, 0.12, 20, 36]} />
            <meshStandardMaterial color="#1E293B" roughness={0.8} metalness={0.1} />
          </mesh>
          {/* Alloy Rim (Metallic Silver) */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 0.08, 24]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Subtle blue rim highlight */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.34, 0.014, 12, 32]} />
            <meshBasicMaterial color="#3B82F6" />
          </mesh>
          {/* Brake Disc */}
          <mesh position={[0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.015, 24]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* REAR WHEEL ASSEMBLY */}
        <group ref={rearWheelRef} position={[0, 0.55, -1.25]}>
          {/* Wider Rear Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.52, 0.15, 20, 36]} />
            <meshStandardMaterial color="#1E293B" roughness={0.8} metalness={0.1} />
          </mesh>
          {/* Rear Alloy Rim */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.36, 0.36, 0.10, 24]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Subtle rim highlight */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.32, 0.014, 12, 32]} />
            <meshBasicMaterial color="#3B82F6" />
          </mesh>
        </group>

        {/* FRONT FORKS & HANDLEBARS */}
        <group position={[0, 0.90, 1.15]} rotation={[-0.38, 0, 0]}>
          {/* Dual Chrome Telescopic Forks */}
          <mesh position={[0.14, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 1.35, 16]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[-0.14, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 1.35, 16]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.1} />
          </mesh>

          {/* Triple Clamp */}
          <mesh position={[0, 0.65, 0]}>
            <boxGeometry args={[0.34, 0.05, 0.1]} />
            <meshStandardMaterial color="#64748B" metalness={0.8} />
          </mesh>

          {/* Handlebars */}
          <mesh position={[0, 0.68, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.024, 0.024, 0.82, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
          {/* Left Grip */}
          <mesh position={[0.38, 0.68, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.032, 0.032, 0.12, 12]} />
            <meshStandardMaterial color="#1E293B" roughness={0.9} />
          </mesh>
          {/* Right Grip */}
          <mesh position={[-0.38, 0.68, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.032, 0.032, 0.12, 12]} />
            <meshStandardMaterial color="#1E293B" roughness={0.9} />
          </mesh>

          {/* Clean Front Headlight Housing (Blue) */}
          <mesh position={[0, 0.45, 0.12]} rotation={[0.38, 0, 0]}>
            <boxGeometry args={[0.26, 0.22, 0.16]} />
            <meshStandardMaterial color="#2563EB" metalness={0.7} roughness={0.2} />
          </mesh>
          {/* Headlight Lens */}
          <group position={[0, 0.45, 0.21]} rotation={[0.38, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          </group>
          {/* Forward Headlight Spotlight */}
          <spotLight
            position={[0, 0.45, 0.25]}
            target-position={[0, 0, 4]}
            angle={0.6}
            penumbra={0.4}
            intensity={3.5}
            color="#FFFFFF"
            distance={8}
          />
        </group>

        {/* MOTORCYCLE FRAME & ENGINE */}
        {/* Main Frame Spine */}
        <mesh position={[0, 0.85, 0.2]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.28, 0.32, 1.2]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Engine Block */}
        <group position={[0, 0.62, 0.1]}>
          <mesh>
            <boxGeometry args={[0.36, 0.38, 0.55]} />
            <meshStandardMaterial color="#64748B" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Engine Fins */}
          {[-0.08, 0, 0.08].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
              <boxGeometry args={[0.40, 0.02, 0.58]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.9} />
            </mesh>
          ))}
          {/* Side Alternator Cover */}
          <mesh position={[0.20, -0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
          </mesh>
        </group>

        {/* Clean Chrome Exhaust System */}
        <group position={[0.22, 0.52, -0.65]} rotation={[0.18, -0.1, 0]}>
          <mesh>
            <cylinderGeometry args={[0.065, 0.08, 0.9, 16]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>

        {/* Rear Swingarm */}
        <mesh position={[0, 0.60, -0.75]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.26, 0.08, 1.05]} />
          <meshStandardMaterial color="#64748B" metalness={0.8} />
        </mesh>

        {/* SCULPTED FUEL TANK (CLEAN BLUE) */}
        <group position={[0, 1.12, 0.22]}>
          <mesh rotation={[0.22, 0, 0]}>
            <boxGeometry args={[0.42, 0.38, 0.82]} />
            <meshStandardMaterial color="#2563EB" metalness={0.7} roughness={0.2} />
          </mesh>
          {/* Fuel Cap */}
          <mesh position={[0, 0.20, 0.1]} rotation={[0.22, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.95} />
          </mesh>
        </group>

        {/* SEAT & TAIL SECTION */}
        {/* Rider Saddle */}
        <mesh position={[0, 1.05, -0.40]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[0.32, 0.14, 0.60]} />
          <meshStandardMaterial color="#1E293B" roughness={0.8} metalness={0.1} />
        </mesh>
        {/* Tail Cowl (Blue) */}
        <mesh position={[0, 1.15, -1.05]} rotation={[-0.22, 0, 0]}>
          <boxGeometry args={[0.24, 0.16, 0.45]} />
          <meshStandardMaterial color="#2563EB" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Red Taillight */}
        <mesh position={[0, 1.12, -1.28]}>
          <boxGeometry args={[0.18, 0.04, 0.03]} />
          <meshBasicMaterial color="#DC2626" />
        </mesh>

        {/* Footpegs */}
        <group position={[0.22, 0.52, -0.32]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.14, 12]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
          </mesh>
        </group>
        <group position={[-0.22, 0.52, -0.32]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.14, 12]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* ================= 3. RIDER WITH VISIBLE HELMET ================= */}
      <group position={[0, 0, 0]}>
        {/* Rider Lower Body / Legs on pegs */}
        <mesh position={[0.20, 0.95, -0.15]} rotation={[0.75, 0.2, -0.2]}>
          <cylinderGeometry args={[0.07, 0.06, 0.55, 12]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
        <mesh position={[-0.20, 0.95, -0.15]} rotation={[0.75, -0.2, 0.2]}>
          <cylinderGeometry args={[0.07, 0.06, 0.55, 12]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
        <mesh position={[0.20, 0.65, -0.25]} rotation={[-0.6, 0.1, 0]}>
          <cylinderGeometry args={[0.055, 0.05, 0.45, 12]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
        <mesh position={[-0.20, 0.65, -0.25]} rotation={[-0.6, -0.1, 0]}>
          <cylinderGeometry args={[0.055, 0.05, 0.45, 12]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>

        {/* Rider Torso leaning forward toward handlebars */}
        <mesh position={[0, 1.42, -0.12]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.38, 0.48, 0.32]} />
          <meshStandardMaterial color="#1E293B" roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Arms holding handlebars */}
        <mesh position={[0.26, 1.40, 0.22]} rotation={[0.75, 0.2, -0.3]}>
          <cylinderGeometry args={[0.055, 0.048, 0.58, 12]} />
          <meshStandardMaterial color="#1E293B" roughness={0.6} />
        </mesh>
        <mesh position={[-0.26, 1.40, 0.22]} rotation={[0.75, -0.2, 0.3]}>
          <cylinderGeometry args={[0.055, 0.048, 0.58, 12]} />
          <meshStandardMaterial color="#1E293B" roughness={0.6} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.68, 0.08]} rotation={[0.35, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.08, 0.14, 16]} />
          <meshStandardMaterial color="#64748B" />
        </mesh>

        {/* ================= RECOGNIZABLE MOTORCYCLE HELMET ================= */}
        <group position={[0, 1.88, 0.22]} rotation={[0.2, 0, 0]}>
          {/* Main Helmet Shell (Clean White) */}
          <mesh>
            <sphereGeometry args={[0.24, 24, 24]} />
            <meshStandardMaterial
              color={highlightViolation ? '#991B1B' : '#FFFFFF'}
              metalness={0.3}
              roughness={0.2}
            />
          </mesh>
          {/* Chin Bar */}
          <mesh position={[0, -0.08, 0.14]}>
            <boxGeometry args={[0.20, 0.12, 0.15]} />
            <meshStandardMaterial
              color={highlightViolation ? '#7F1D1D' : '#334155'}
              metalness={0.4}
            />
          </mesh>
          {/* Visor: Green when detected, Red when violation */}
          <mesh position={[0, 0.03, 0.18]} rotation={[-0.06, 0, 0]}>
            <boxGeometry args={[0.24, 0.10, 0.08]} />
            <meshBasicMaterial color={helmetColor} />
          </mesh>
        </group>

        {/* Subtle AI Detection Bounding Box around helmet */}
        <mesh position={[0, 1.88, 0.22]}>
          <boxGeometry args={[0.62, 0.62, 0.62]} />
          <meshBasicMaterial
            color={helmetColor}
            wireframe
            transparent
            opacity={0.4}
          />
        </mesh>
      </group>

      {/* ================= 4. CLEAN COMPUTER-VISION LABELS (LIGHT THEME) ================= */}
      {/* Rider Status Tag */}
      <Html position={[1.2, 2.2, 0.2]} center distanceFactor={6}>
        <div className="select-none pointer-events-none whitespace-nowrap bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 shadow-md">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: helmetColor }} />
            <span className="text-slate-900">RIDER</span>
            <span className="text-slate-400 font-normal">• Driver</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Helmet:{' '}
            <span className="font-semibold" style={{ color: helmetColor }}>
              {highlightViolation ? 'No Helmet (Violation)' : 'Detected'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">Confidence: 96.8%</div>
        </div>
      </Html>

      {/* Vehicle Status Tag */}
      <Html position={[-1.3, 0.7, 1.2]} center distanceFactor={6}>
        <div className="select-none pointer-events-none whitespace-nowrap bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans text-slate-800 shadow-md">
          <div className="flex items-center gap-1.5 font-bold text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>MOTORCYCLE #03</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">Class: Two-Wheeler</div>
          <div className="text-[10px] text-slate-400">Confidence: 98.2%</div>
        </div>
      </Html>
    </group>
  );
};
