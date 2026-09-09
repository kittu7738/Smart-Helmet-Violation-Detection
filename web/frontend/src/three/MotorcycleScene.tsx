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
  const scanBeamRef = useRef<THREE.Group>(null);
  const outerRadarRef = useRef<THREE.Mesh>(null);
  const midRadarRef = useRef<THREE.Mesh>(null);
  const innerRadarRef = useRef<THREE.Mesh>(null);
  const frontWheelRef = useRef<THREE.Group>(null);
  const rearWheelRef = useRef<THREE.Group>(null);

  // High-contrast cyber palette
  const neonCyan = '#00E5FF';
  const neonGreen = '#00FF9C';
  const violationRed = '#FF3158';
  const activeColor = highlightViolation ? violationRed : neonCyan;

  // Frame animation loop
  useFrame((state, delta) => {
    // Subtle vehicle engine idle suspension vibration
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.4) * 0.03;
    }

    // Holographic vertical laser scan beam animation
    if (scanBeamRef.current && isScanning) {
      scanBeamRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.0) * 1.3 + 1.2;
    }

    // Concentric scanning platform radar sweeps
    if (outerRadarRef.current) {
      outerRadarRef.current.rotation.z += delta * 0.4;
    }
    if (midRadarRef.current) {
      midRadarRef.current.rotation.z -= delta * 0.6;
    }
    if (innerRadarRef.current) {
      innerRadarRef.current.rotation.z += delta * 0.8;
    }

    // Wheel rotation speed
    if (frontWheelRef.current && rearWheelRef.current) {
      frontWheelRef.current.rotation.x += delta * 2.5;
      rearWheelRef.current.rotation.x += delta * 2.5;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.45, 0]}>
      {/* ================= 1. DISTANT FUTURISTIC CYBER CITY SKYLINE ================= */}
      <group position={[0, 0, -6.5]}>
        {/* Distant Skyscrapers with illuminated window columns */}
        {[-4.5, -3.0, -1.5, 0, 1.5, 3.0, 4.5].map((x, i) => {
          const height = 2.5 + (i % 3) * 1.2;
          return (
            <group key={i} position={[x * 1.5, height / 2 - 0.5, -2]}>
              <mesh>
                <boxGeometry args={[1.2, height, 1.2]} />
                <meshStandardMaterial
                  color="#070C1A"
                  roughness={0.8}
                  metalness={0.6}
                />
              </mesh>
              {/* Glowing vertical cyber window strip */}
              <mesh position={[0, 0, 0.61]}>
                <planeGeometry args={[0.12, height * 0.8]} />
                <meshBasicMaterial
                  color={i % 2 === 0 ? '#00E5FF' : '#1687FF'}
                  transparent
                  opacity={0.35}
                />
              </mesh>
            </group>
          );
        })}

        {/* Distant Elevated Highway / Traffic Light Beam */}
        <mesh position={[0, 0.4, -0.5]}>
          <boxGeometry args={[22, 0.08, 0.3]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.4} />
        </mesh>
        <mesh position={[0, 0.46, -0.5]}>
          <boxGeometry args={[22, 0.02, 0.02]} />
          <meshBasicMaterial color="#00FF9C" />
        </mesh>
      </group>

      {/* ================= 2. FLOATING CYBER TELEMETRY PARTICLES ================= */}
      <Sparkles
        count={70}
        scale={[7, 4.5, 7]}
        size={2.6}
        speed={0.35}
        color={highlightViolation ? '#FF3158' : '#00E5FF'}
        opacity={0.85}
      />

      {/* ================= 3. SCANNING CHAMBER PLATFORM & RADARS ================= */}
      {/* Heavy Cylindrical Metallic Command Platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <cylinderGeometry args={[3.8, 4.0, 0.16, 64]} />
        <meshStandardMaterial
          color="#070E1C"
          roughness={0.2}
          metalness={0.92}
        />
      </mesh>

      {/* Outer Luminous Platform Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[3.72, 3.82, 64]} />
        <meshBasicMaterial color="#00E5FF" side={THREE.DoubleSide} />
      </mesh>

      {/* Rotating Radar Ring Outer (Cyan) */}
      <mesh ref={outerRadarRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[2.7, 2.76, 48]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Rotating Radar Ring Middle (Green) */}
      <mesh ref={midRadarRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[1.85, 1.90, 48]} />
        <meshBasicMaterial color="#00FF9C" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Rotating Radar Ring Inner (Purple) */}
      <mesh ref={innerRadarRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.0, 1.05, 32]} />
        <meshBasicMaterial color="#B44CFF" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>

      {/* High-Contrast Cyber Floor Grid */}
      <gridHelper args={[7.6, 26, '#00E5FF', '#0D2040']} position={[0, 0.01, 0]} />

      {/* ================= 4. VERTICAL LASER SCAN BEAM ================= */}
      {isScanning && (
        <group ref={scanBeamRef} position={[0, 1.2, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.4, 2.4]} />
            <meshBasicMaterial
              color={activeColor}
              transparent
              opacity={0.22}
              side={THREE.DoubleSide}
              wireframe
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.15, 2.22, 64]} />
            <meshBasicMaterial color={activeColor} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* ================= 5. PROCEDURAL MOTORCYCLE (THE HERO) ================= */}
      {/* Orient along Z-axis: Front is +Z, Rear is -Z */}
      <group position={[0, 0, 0]}>

        {/* ----- A. FRONT WHEEL & BRAKE ASSEMBLY ----- */}
        <group ref={frontWheelRef} position={[0, 0.58, 1.48]}>
          {/* Outer Tread Rubber Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.56, 0.13, 24, 48]} />
            <meshStandardMaterial color="#0A0E18" roughness={0.85} metalness={0.15} />
          </mesh>
          {/* Metallic Cast Rim */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.42, 0.42, 0.09, 32]} />
            <meshStandardMaterial color="#26344B" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Rim Glowing Neon Cyan Outer Ring */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.38, 0.022, 16, 48]} />
            <meshBasicMaterial color="#00E5FF" />
          </mesh>
          {/* Rim Glowing Neon Green Inner Ring */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.24, 0.016, 16, 36]} />
            <meshBasicMaterial color="#00FF9C" />
          </mesh>
          {/* Dual Perforated Chrome Brake Discs */}
          <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.32, 0.32, 0.015, 32]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.98} roughness={0.1} />
          </mesh>
          <mesh position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.32, 0.32, 0.015, 32]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.98} roughness={0.1} />
          </mesh>
          {/* Wheel Axle Spindle */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.22, 16]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.9} />
          </mesh>
        </group>

        {/* Front Red Brembo Sport Brake Calipers */}
        <mesh position={[0.10, 0.68, 1.34]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.06, 0.16, 0.08]} />
          <meshStandardMaterial color="#FF3158" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.10, 0.68, 1.34]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.06, 0.16, 0.08]} />
          <meshStandardMaterial color="#FF3158" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* ----- B. REAR WHEEL & SPROCKET ASSEMBLY ----- */}
        <group ref={rearWheelRef} position={[0, 0.58, -1.40]}>
          {/* Wider Rear Rubber Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.56, 0.17, 24, 48]} />
            <meshStandardMaterial color="#0A0E18" roughness={0.85} metalness={0.15} />
          </mesh>
          {/* Rear Metallic Rim */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.40, 0.40, 0.12, 32]} />
            <meshStandardMaterial color="#26344B" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Glowing Neon Cyan Outer Ring */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.36, 0.024, 16, 48]} />
            <meshBasicMaterial color="#00E5FF" />
          </mesh>
          {/* Rear Drive Sprocket Gear */}
          <mesh position={[0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.26, 0.26, 0.02, 28]} />
            <meshStandardMaterial color="#64748B" metalness={0.95} roughness={0.2} />
          </mesh>
        </group>

        {/* ----- C. FRONT FORKS, TRIPLE TREES & STEERING ----- */}
        <group position={[0, 0.95, 1.25]} rotation={[-0.42, 0, 0]}>
          {/* Left Inverted Chrome Fork Tube */}
          <mesh position={[0.16, 0, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 1.45, 24]} />
            <meshStandardMaterial color="#F1F5F9" metalness={0.98} roughness={0.05} />
          </mesh>
          {/* Right Inverted Chrome Fork Tube */}
          <mesh position={[-0.16, 0, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 1.45, 24]} />
            <meshStandardMaterial color="#F1F5F9" metalness={0.98} roughness={0.05} />
          </mesh>

          {/* Lower Triple Tree Clamp */}
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.38, 0.06, 0.12]} />
            <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Upper Triple Tree Clamp */}
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[0.38, 0.05, 0.12]} />
            <meshStandardMaterial color="#334155" metalness={0.95} roughness={0.1} />
          </mesh>

          {/* Front Fender / Mudguard hugging the front tire */}
          <mesh position={[0, -0.22, 0.14]} rotation={[0.45, 0, 0]}>
            <cylinderGeometry args={[0.60, 0.60, 0.24, 24, 1, true, -Math.PI / 3, (2 * Math.PI) / 3]} />
            <meshStandardMaterial color="#10254C" metalness={0.9} roughness={0.15} />
          </mesh>

          {/* Handlebars with Ergonomic Clip-ons */}
          <group position={[0, 0.74, 0.02]}>
            {/* Center handlebar clamp */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.026, 0.026, 0.92, 20]} />
              <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Left Textured Grip */}
            <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.036, 0.036, 0.14, 16]} />
              <meshStandardMaterial color="#020617" roughness={0.9} />
            </mesh>
            {/* Right Textured Grip */}
            <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.036, 0.036, 0.14, 16]} />
              <meshStandardMaterial color="#020617" roughness={0.9} />
            </mesh>
            {/* Front Brake Hand Lever (Silver) */}
            <mesh position={[-0.40, -0.04, 0.08]} rotation={[0.2, 0.2, 0]}>
              <boxGeometry args={[0.015, 0.03, 0.14]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.95} />
            </mesh>
            {/* Clutch Hand Lever (Silver) */}
            <mesh position={[0.40, -0.04, 0.08]} rotation={[0.2, -0.2, 0]}>
              <boxGeometry args={[0.015, 0.03, 0.14]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.95} />
            </mesh>
            {/* Aerodynamic Bar-End Mirrors */}
            <mesh position={[0.49, 0.06, 0.02]} rotation={[0, 0.3, 0]}>
              <boxGeometry args={[0.015, 0.08, 0.12]} />
              <meshStandardMaterial color="#0F172A" metalness={0.8} />
            </mesh>
            <mesh position={[-0.49, 0.06, 0.02]} rotation={[0, -0.3, 0]}>
              <boxGeometry args={[0.015, 0.08, 0.12]} />
              <meshStandardMaterial color="#0F172A" metalness={0.8} />
            </mesh>

            {/* Digital TFT Instrument Cluster Screen */}
            <mesh position={[0, 0.06, 0.08]} rotation={[0.55, 0, 0]}>
              <boxGeometry args={[0.22, 0.14, 0.02]} />
              <meshStandardMaterial color="#020617" />
            </mesh>
            <mesh position={[0, 0.07, 0.09]} rotation={[0.55, 0, 0]}>
              <planeGeometry args={[0.20, 0.12]} />
              <meshBasicMaterial color="#00E5FF" />
            </mesh>
          </group>

          {/* Aggressive Front Cowl & Xenon Dual Projector Headlights */}
          <group position={[0, 0.48, 0.18]}>
            {/* Nose Fairing Housing */}
            <mesh rotation={[0.45, 0, 0]}>
              <boxGeometry args={[0.36, 0.32, 0.22]} />
              <meshStandardMaterial color="#0F244C" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Tinted Aerodynamic Windshield */}
            <mesh position={[0, 0.24, 0.04]} rotation={[0.52, 0, 0]}>
              <planeGeometry args={[0.30, 0.24]} />
              <meshPhysicalMaterial
                color="#00E5FF"
                transmission={0.8}
                opacity={0.85}
                transparent
                roughness={0.08}
              />
            </mesh>
            {/* Dual Projector Headlight Lenses */}
            <mesh position={[0.09, -0.04, 0.12]}>
              <sphereGeometry args={[0.065, 20, 20]} />
              <meshBasicMaterial color="#E0F2FE" />
            </mesh>
            <mesh position={[-0.09, -0.04, 0.12]}>
              <sphereGeometry args={[0.065, 20, 20]} />
              <meshBasicMaterial color="#E0F2FE" />
            </mesh>
            {/* Actual High-Power Three.js SpotLight projection on the road */}
            <spotLight
              position={[0, 0, 0.2]}
              target-position={[0, -0.5, 6]}
              angle={0.65}
              penumbra={0.5}
              intensity={6.0}
              color="#00E5FF"
              distance={12}
            />
          </group>
        </group>

        {/* ----- D. MAIN CHASSIS, FRAME & ENGINE BLOCK ----- */}
        {/* Heavy Twin-Spar Aluminum Perimeter Frame */}
        <mesh position={[0.18, 0.96, 0.3]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[0.08, 0.16, 1.25]} />
          <meshStandardMaterial color="#334155" metalness={0.96} roughness={0.15} />
        </mesh>
        <mesh position={[-0.18, 0.96, 0.3]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[0.08, 0.16, 1.25]} />
          <meshStandardMaterial color="#334155" metalness={0.96} roughness={0.15} />
        </mesh>

        {/* Detailed 4-Cylinder Engine Block */}
        <group position={[0, 0.68, 0.15]}>
          {/* Main Crankcase */}
          <mesh>
            <boxGeometry args={[0.42, 0.44, 0.68]} />
            <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.2} />
          </mesh>
          {/* Horizontal Cooling Fins Layering */}
          {[0.16, 0.10, 0.04, -0.02, -0.08].map((y, idx) => (
            <mesh key={idx} position={[0, y, 0]}>
              <boxGeometry args={[0.46, 0.018, 0.70]} />
              <meshStandardMaterial color="#64748B" metalness={0.98} roughness={0.1} />
            </mesh>
          ))}
          {/* Stator / Alternator Circular Chrome Cover (Left side) */}
          <mesh position={[0.23, -0.05, -0.05]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.16, 0.05, 24]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.98} roughness={0.08} />
          </mesh>
          {/* Clutch Basket Cover (Right side) */}
          <mesh position={[-0.23, -0.05, 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.15, 0.05, 24]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.98} roughness={0.08} />
          </mesh>
          {/* Front Curved Radiator behind front wheel */}
          <mesh position={[0, 0.08, 0.48]} rotation={[-0.15, 0, 0]}>
            <boxGeometry args={[0.36, 0.38, 0.06]} />
            <meshStandardMaterial color="#0F172A" roughness={0.8} />
          </mesh>
        </group>

        {/* ----- E. SCULPTED AERODYNAMIC FUEL TANK ----- */}
        <group position={[0, 1.24, 0.28]}>
          {/* Main Tank Body: Deep Metallic Cyber Blue */}
          <mesh rotation={[0.26, 0, 0]}>
            <boxGeometry args={[0.48, 0.44, 0.95]} />
            <meshStandardMaterial
              color="#0D2248"
              metalness={0.92}
              roughness={0.12}
            />
          </mesh>
          {/* Left Luminous Cyan Tank Contour Stripe */}
          <mesh position={[0.25, 0.02, 0]} rotation={[0.26, 0, 0]}>
            <boxGeometry args={[0.025, 0.06, 0.92]} />
            <meshBasicMaterial color={activeColor} />
          </mesh>
          {/* Right Luminous Cyan Tank Contour Stripe */}
          <mesh position={[-0.25, 0.02, 0]} rotation={[0.26, 0, 0]}>
            <boxGeometry args={[0.025, 0.06, 0.92]} />
            <meshBasicMaterial color={activeColor} />
          </mesh>
          {/* Aircraft-Style Flush Chrome Fuel Cap */}
          <mesh position={[0, 0.24, 0.12]} rotation={[0.26, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.025, 24]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.98} roughness={0.05} />
          </mesh>
        </group>

        {/* ----- F. SEAT & REAR TAIL COWL SECTION ----- */}
        {/* Contoured Rider Seat (Leather Textured) */}
        <mesh position={[0, 1.15, -0.46]} rotation={[-0.12, 0, 0]}>
          <boxGeometry args={[0.36, 0.16, 0.72]} />
          <meshStandardMaterial color="#0B0F19" roughness={0.8} metalness={0.2} />
        </mesh>
        {/* Step-up Passenger Pillion Seat */}
        <mesh position={[0, 1.25, -0.92]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[0.28, 0.14, 0.42]} />
          <meshStandardMaterial color="#0F172A" roughness={0.8} metalness={0.2} />
        </mesh>
        {/* Sharp Upswept Aerodynamic Tail Cowl */}
        <mesh position={[0, 1.28, -1.28]} rotation={[-0.26, 0, 0]}>
          <boxGeometry args={[0.26, 0.20, 0.52]} />
          <meshStandardMaterial color="#0D2248" metalness={0.92} roughness={0.12} />
        </mesh>
        {/* Rear Integrated LED Tail Light Strip (Bright Red) */}
        <mesh position={[0, 1.24, -1.54]}>
          <boxGeometry args={[0.22, 0.04, 0.04]} />
          <meshBasicMaterial color="#FF3158" />
        </mesh>

        {/* ----- G. REAR SWINGARM & SUSPENSION MONOSHOCK ----- */}
        {/* Left Swingarm Girder */}
        <mesh position={[0.16, 0.65, -0.88]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.06, 0.12, 1.2]} />
          <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.2} />
        </mesh>
        {/* Right Swingarm Girder */}
        <mesh position={[-0.16, 0.65, -0.88]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.06, 0.12, 1.2]} />
          <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.2} />
        </mesh>
        {/* Visible Coil-Over Monoshock Spring under the seat */}
        <mesh position={[0, 0.85, -0.58]} rotation={[-0.55, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.34, 16]} />
          <meshStandardMaterial color="#FFD400" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* ----- H. EXHAUST SYSTEM & CHROME HEADERS ----- */}
        {/* 4 Exhaust Header Pipes sweeping down from engine */}
        <group position={[0.06, 0.48, 0.32]}>
          <mesh rotation={[0.3, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.42, 16]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.98} roughness={0.1} />
          </mesh>
        </group>
        <group position={[-0.06, 0.48, 0.32]}>
          <mesh rotation={[0.3, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.42, 16]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.98} roughness={0.1} />
          </mesh>
        </group>
        {/* Upswept Titanium Sport Muffler Canister on Right Flank */}
        <group position={[0.26, 0.62, -0.78]} rotation={[0.28, -0.15, 0]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.095, 0.95, 20]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.98} roughness={0.12} />
          </mesh>
          {/* Carbon Heat Shield Plate */}
          <mesh position={[0.04, 0.08, 0]}>
            <boxGeometry args={[0.02, 0.45, 0.14]} />
            <meshStandardMaterial color="#0F172A" roughness={0.6} />
          </mesh>
          {/* Glowing Hot Exhaust Outlet Ring */}
          <mesh position={[0, -0.49, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.03, 20]} />
            <meshBasicMaterial color="#00E5FF" />
          </mesh>
        </group>

        {/* Rider Footpegs & Rearsets */}
        <mesh position={[0.26, 0.58, -0.38]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.16, 12]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.95} />
        </mesh>
        <mesh position={[-0.26, 0.58, -0.38]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.16, 12]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.95} />
        </mesh>

        {/* Underbody Neon Glow Strip */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.30, 0.03, 1.45]} />
          <meshBasicMaterial color={activeColor} />
        </mesh>
      </group>

      {/* ================= 6. THE RIDER (REALISTIC SPORT-RIDING POSTURE) ================= */}
      <group position={[0, 0, 0]}>
        {/* Hip & Pelvis firmly planted on the seat */}
        <mesh position={[0, 1.28, -0.42]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[0.36, 0.32, 0.32]} />
          <meshStandardMaterial color="#0B1228" roughness={0.5} metalness={0.4} />
        </mesh>

        {/* Upper Thighs hugging the fuel tank */}
        <mesh position={[0.24, 1.08, -0.18]} rotation={[0.82, 0.22, -0.25]}>
          <cylinderGeometry args={[0.08, 0.07, 0.62, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[-0.24, 1.08, -0.18]} rotation={[0.82, -0.22, 0.25]}>
          <cylinderGeometry args={[0.08, 0.07, 0.62, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* Knee Armor Sliders */}
        <mesh position={[0.28, 0.88, 0.06]}>
          <boxGeometry args={[0.08, 0.12, 0.1]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.9} />
        </mesh>
        <mesh position={[-0.28, 0.88, 0.06]}>
          <boxGeometry args={[0.08, 0.12, 0.1]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.9} />
        </mesh>

        {/* Lower Shins angled back to the footpegs */}
        <mesh position={[0.25, 0.72, -0.18]} rotation={[-0.75, 0.15, 0]}>
          <cylinderGeometry args={[0.065, 0.055, 0.52, 16]} />
          <meshStandardMaterial color="#0B1228" roughness={0.7} />
        </mesh>
        <mesh position={[-0.25, 0.72, -0.18]} rotation={[-0.75, -0.15, 0]}>
          <cylinderGeometry args={[0.065, 0.055, 0.52, 16]} />
          <meshStandardMaterial color="#0B1228" roughness={0.7} />
        </mesh>

        {/* Riding Boots resting on footpegs */}
        <mesh position={[0.25, 0.58, -0.34]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.09, 0.12, 0.22]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>
        <mesh position={[-0.25, 0.58, -0.34]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.09, 0.12, 0.22]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>

        {/* Main Torso Leaning Forward over Fuel Tank in Sport Posture */}
        <mesh position={[0, 1.56, -0.15]} rotation={[0.55, 0, 0]}>
          <boxGeometry args={[0.44, 0.54, 0.36]} />
          <meshStandardMaterial color="#111B33" roughness={0.4} metalness={0.5} />
        </mesh>

        {/* Glowing Segmented Cyber Spine on Rider's Jacket */}
        <mesh position={[0, 1.62, -0.34]} rotation={[0.55, 0, 0]}>
          <boxGeometry args={[0.045, 0.48, 0.025]} />
          <meshBasicMaterial color={activeColor} />
        </mesh>

        {/* Rider Shoulders & Arms Extending to Handlebars */}
        {/* Left Arm */}
        <mesh position={[0.29, 1.56, 0.20]} rotation={[0.78, 0.24, -0.35]}>
          <cylinderGeometry args={[0.065, 0.055, 0.62, 16]} />
          <meshStandardMaterial color="#1E293B" roughness={0.5} />
        </mesh>
        {/* Left Gloved Hand on Grip */}
        <mesh position={[0.41, 1.40, 0.92]}>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>

        {/* Right Arm */}
        <mesh position={[-0.29, 1.56, 0.20]} rotation={[0.78, -0.24, 0.35]}>
          <cylinderGeometry args={[0.065, 0.055, 0.62, 16]} />
          <meshStandardMaterial color="#1E293B" roughness={0.5} />
        </mesh>
        {/* Right Gloved Hand on Grip */}
        <mesh position={[-0.41, 1.40, 0.92]}>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.86, 0.08]} rotation={[0.38, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.18, 20]} />
          <meshStandardMaterial color="#334155" roughness={0.4} />
        </mesh>

        {/* ================= SMART HELMET ================= */}
        <group position={[0, 2.08, 0.24]} rotation={[0.22, 0, 0]}>
          {/* Main Full-Face Helmet Shell */}
          <mesh>
            <sphereGeometry args={[0.26, 32, 32]} />
            <meshStandardMaterial
              color={highlightViolation ? '#5C081A' : '#F1F5F9'}
              metalness={0.8}
              roughness={0.12}
            />
          </mesh>
          {/* Aerodynamic Chin Guard */}
          <mesh position={[0, -0.09, 0.16]}>
            <boxGeometry args={[0.24, 0.15, 0.18]} />
            <meshStandardMaterial
              color={highlightViolation ? '#33050F' : '#0F172A'}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          {/* Glowing Smart Visor HUD Shield */}
          <mesh position={[0, 0.04, 0.20]} rotation={[-0.08, 0, 0]}>
            <boxGeometry args={[0.28, 0.12, 0.12]} />
            <meshBasicMaterial color={highlightViolation ? violationRed : neonGreen} />
          </mesh>
          {/* Top Aerodynamic Cyber Crest Fin */}
          <mesh position={[0, 0.16, -0.08]} rotation={[-0.32, 0, 0]}>
            <boxGeometry args={[0.05, 0.08, 0.26]} />
            <meshBasicMaterial color={activeColor} />
          </mesh>
        </group>

        {/* 3D Wireframe AI Detection Bounding Box around Head / Helmet */}
        <mesh position={[0, 2.08, 0.24]}>
          <boxGeometry args={[0.68, 0.68, 0.68]} />
          <meshBasicMaterial
            color={activeColor}
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>

      {/* ================= 7. HOLOGRAPHIC WORLD-SPACE 3D HUD LABELS ================= */}
      {/* 1. Rider Detection Holographic HUD Box (Upper Right) */}
      <Html position={[1.4, 2.4, 0.3]} center distanceFactor={6}>
        <div className="select-none pointer-events-none whitespace-nowrap bg-[#060B19]/95 backdrop-blur-2xl border-2 border-[#00FF9C] rounded-xl px-4 py-2.5 shadow-neon-green text-xs font-mono">
          <div className="flex items-center gap-2 font-black tracking-wider text-[#00FF9C]">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00FF9C] animate-ping" />
            <span className="text-glow-green">RIDER [DRIVER]</span>
          </div>
          <div className="text-slate-200 mt-1 font-bold flex items-center justify-between gap-3 text-xs">
            <span>Helmet:</span>
            <span className={highlightViolation ? 'text-[#FF3158] font-black text-glow-red animate-pulse' : 'text-[#00FF9C] font-black text-glow-green'}>
              {highlightViolation ? 'VIOLATION: NO HELMET' : 'DETECTED (COMPLIANT)'}
            </span>
          </div>
          <div className="text-slate-400 text-[11px] flex items-center justify-between gap-2 mt-0.5">
            <span>Confidence:</span>
            <span className="text-[#00E5FF] font-black text-glow-cyan">96.8%</span>
          </div>
        </div>
      </Html>

      {/* 2. Motorcycle Detection Holographic HUD Box (Lower Left) */}
      <Html position={[-1.5, 0.8, 1.4]} center distanceFactor={6}>
        <div className="select-none pointer-events-none whitespace-nowrap bg-[#060B19]/95 backdrop-blur-2xl border-2 border-[#00E5FF] rounded-xl px-4 py-2.5 shadow-neon-cyan text-xs font-mono">
          <div className="flex items-center gap-2 font-black tracking-wider text-[#00E5FF]">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00E5FF]" />
            <span className="text-glow-cyan">MOTORCYCLE #03</span>
          </div>
          <div className="text-slate-200 mt-1 font-bold flex items-center justify-between gap-3 text-xs">
            <span>Class:</span>
            <span className="text-white font-black">Two-Wheeler</span>
          </div>
          <div className="text-slate-400 text-[11px] flex items-center justify-between gap-2 mt-0.5">
            <span>Confidence:</span>
            <span className="text-[#00FF9C] font-black text-glow-green">98.2%</span>
          </div>
        </div>
      </Html>

      {/* 3. Simulated Violation Tag (When simulated or detected) */}
      {highlightViolation && (
        <Html position={[1.4, 1.3, -0.8]} center distanceFactor={6}>
          <div className="select-none pointer-events-none whitespace-nowrap bg-[#1F040A]/95 backdrop-blur-2xl border-2 border-[#FF3158] rounded-xl px-4 py-2.5 shadow-neon-red text-xs font-mono animate-bounce">
            <div className="flex items-center gap-2 font-black tracking-wider text-[#FF3158]">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF3158] animate-ping" />
              <span className="text-glow-red">VIOLATION ALERT</span>
            </div>
            <div className="text-white mt-1 font-bold text-xs">
              NO HELMET INFRACTION
            </div>
            <div className="text-slate-300 text-[11px] flex items-center justify-between gap-2 mt-0.5">
              <span>Confidence:</span>
              <span className="text-[#FF3158] font-black text-glow-red">94.7%</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};
