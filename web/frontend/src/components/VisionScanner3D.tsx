import React, { useRef, useMemo, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { DetectionItem } from '../services/api';
import { Camera, Scan, Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export type ScannerState = 'IDLE' | 'READY' | 'SCANNING' | 'ANALYZING' | 'RESULT_READY' | 'ERROR';

interface VisionScanner3DProps {
  imageUrl?: string | null;
  detections?: DetectionItem[];
  state?: ScannerState;
  selectedIdx?: number | null;
  onSelectDetection?: (idx: number | null) => void;
  aspectRatio?: number;
  className?: string;
}

// Inner 3D Image Canvas Plane
const ScannedImagePlane: React.FC<{
  url: string;
  scannerState: ScannerState;
  detections: DetectionItem[];
  selectedIdx: number | null;
  onSelect: (idx: number | null) => void;
}> = ({ url, scannerState, detections, selectedIdx, onSelect }) => {
  const texture = useTexture(url);
  const scanLineRef = useRef<THREE.Mesh>(null);
  const frameGroupRef = useRef<THREE.Group>(null);

  // Calculate plane dimensions preserving image aspect ratio
  const { planeWidth, planeHeight } = useMemo(() => {
    if (!texture.image) return { planeWidth: 3.6, planeHeight: 2.4 };
    const imgWidth = texture.image.width || 16;
    const imgHeight = texture.image.height || 9;
    const maxDim = 3.6;
    if (imgWidth > imgHeight) {
      return { planeWidth: maxDim, planeHeight: (imgHeight / imgWidth) * maxDim };
    } else {
      return { planeWidth: (imgWidth / imgHeight) * maxDim, planeHeight: maxDim };
    }
  }, [texture]);

  // Laser scanning sweep animation
  useFrame((state) => {
    if (scanLineRef.current) {
      if (scannerState === 'SCANNING' || scannerState === 'ANALYZING') {
        const t = state.clock.elapsedTime * 2.2;
        scanLineRef.current.position.y = (Math.sin(t) * 0.5) * planeHeight;
        scanLineRef.current.visible = true;
      } else {
        scanLineRef.current.visible = false;
      }
    }

    // Subtle idle float
    if (frameGroupRef.current) {
      frameGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.03;
    }
  });

  return (
    <group ref={frameGroupRef}>
      {/* 1. Floating Glass Bevel Frame (Soft White & Metallic Border) */}
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[planeWidth + 0.22, planeHeight + 0.22, 0.05]} />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.15}
          metalness={0.1}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Frame Shadow Plane */}
      <mesh position={[0, -planeHeight / 2 - 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[planeWidth + 0.6, 1.8]} />
        <meshBasicMaterial color="#E2E8F0" transparent opacity={0.65} />
      </mesh>

      {/* 2. Real Uploaded Image Display */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {/* 3. Sweeping Laser Scan Line (Blue/Indigo during scan) */}
      <mesh ref={scanLineRef} position={[0, 0, 0.04]} visible={false}>
        <planeGeometry args={[planeWidth, 0.04]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* 4. 3D Bounding Box Overlay Projections (Rendered in 3D Depth) */}
      {scannerState === 'RESULT_READY' &&
        detections.map((det, idx) => {
          if (!texture.image) return null;
          const imgW = texture.image.width;
          const imgH = texture.image.height;
          const [x1, y1, x2, y2] = det.bbox;

          // Normalize coordinates to 3D plane space centered at (0,0)
          const boxNormW = ((x2 - x1) / imgW) * planeWidth;
          const boxNormH = ((y2 - y1) / imgH) * planeHeight;
          const boxCenterX = (((x1 + x2) / 2) / imgW - 0.5) * planeWidth;
          const boxCenterY = (0.5 - ((y1 + y2) / 2) / imgH) * planeHeight;

          const isSelected = selectedIdx === idx;
          const boxColor = det.violation ? '#EF4444' : det.class_name === 'bike' ? '#2563EB' : '#10B981';

          return (
            <group
              key={idx}
              position={[boxCenterX, boxCenterY, 0.03]}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(isSelected ? null : idx);
              }}
            >
              {/* Box Outline */}
              <lineSegments>
                <edgesGeometry args={[new THREE.PlaneGeometry(boxNormW, boxNormH)]} />
                <lineBasicMaterial color={boxColor} linewidth={isSelected ? 3 : 2} />
              </lineSegments>

              {/* Box Fill */}
              <mesh>
                <planeGeometry args={[boxNormW, boxNormH]} />
                <meshBasicMaterial
                  color={boxColor}
                  transparent
                  opacity={isSelected ? 0.25 : 0.08}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Floating HTML Tag Label */}
              <Html
                position={[-boxNormW / 2, boxNormH / 2 + 0.06, 0.02]}
                distanceFactor={4.5}
                zIndexRange={[100, 0]}
              >
                <div
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap shadow-sm cursor-pointer transition-all flex items-center gap-1 ${
                    det.violation
                      ? 'bg-red-600 text-white border border-red-700'
                      : det.class_name === 'bike'
                      ? 'bg-blue-600 text-white border border-blue-700'
                      : 'bg-emerald-600 text-white border border-emerald-700'
                  } ${isSelected ? 'ring-2 ring-amber-400 scale-105' : ''}`}
                >
                  <span>{det.display_name}</span>
                  <span className="opacity-90 font-mono text-[10px]">
                    {(det.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </Html>
            </group>
          );
        })}
    </group>
  );
};

// 3D Placeholder when no image is loaded yet
const IdlePlaceholderScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.4;
    }
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.4) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Floating Glass Plate */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.2, 2.2, 0.04]} />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.2}
          metalness={0.05}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Tech Grid Lines */}
      <gridHelper args={[3.0, 10, '#94A3B8', '#E2E8F0']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.025]} />

      {/* Rotating Detection Reticle */}
      <mesh ref={ringRef} position={[0, 0, 0.03]}>
        <ringGeometry args={[0.55, 0.58, 36]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const VisionScanner3D: React.FC<VisionScanner3DProps> = ({
  imageUrl,
  detections = [],
  state = 'IDLE',
  selectedIdx = null,
  onSelectDetection = () => {},
  className = ''
}) => {
  const [autoRotate, setAutoRotate] = useState(false);
  const controlsRef = useRef<any>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  // Check WebGL availability gracefully
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebGlSupported(false);
    } catch {
      setWebGlSupported(false);
    }
  }, []);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const getStateBadge = () => {
    switch (state) {
      case 'SCANNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm animate-pulse">
            <Scan className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            Co-DETR Scanning Frame...
          </span>
        );
      case 'ANALYZING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Query Attention Forward Pass...
          </span>
        );
      case 'RESULT_READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Analysis Complete ({detections.length} Objects)
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            Scanner Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
            <Camera className="w-3.5 h-3.5 text-gray-500" />
            {imageUrl ? 'Ready to Scan' : 'Awaiting Image Feed'}
          </span>
        );
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm flex flex-col ${
        className || 'min-h-[460px] sm:min-h-[520px]'
      }`}
    >
      {/* Top Floating Glass HUD Bar */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {getStateBadge()}
        </div>

        {/* 3D Interaction Toolbar */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-gray-200 shadow-sm pointer-events-auto text-xs">
          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            title="Auto Rotate 3D Scanner"
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              autoRotate ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Rotate</span>
          </button>

          <button
            onClick={handleResetCamera}
            title="Reset Perspective View"
            className="px-2.5 py-1 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* WebGL 3D Canvas */}
      {webGlSupported ? (
        <Canvas
          camera={{ position: [0, 0, 4.4], fov: 42 }}
          className="w-full h-full flex-1 cursor-grab active:cursor-grabbing"
          style={{ background: '#F8FAFC' }}
        >
          {/* Studio Clean Light Environment */}
          <ambientLight intensity={1.5} color="#FFFFFF" />
          <directionalLight position={[5, 6, 6]} intensity={1.8} color="#FFFFFF" />
          <directionalLight position={[-5, 4, 3]} intensity={1.2} color="#EFF6FF" />
          <pointLight position={[0, 3, 3]} intensity={1.2} color="#FFFFFF" />

          <Suspense fallback={null}>
            {imageUrl ? (
              <ScannedImagePlane
                url={imageUrl}
                scannerState={state}
                detections={detections}
                selectedIdx={selectedIdx}
                onSelect={onSelectDetection}
              />
            ) : (
              <IdlePlaceholderScene />
            )}
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            minDistance={2.5}
            maxDistance={6.5}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.75}
            minAzimuthAngle={-Math.PI / 3}
            maxAzimuthAngle={Math.PI / 3}
            autoRotate={autoRotate}
            autoRotateSpeed={0.8}
            enableDamping
            dampingFactor={0.08}
          />
        </Canvas>
      ) : (
        /* Graceful 2D Fallback if WebGL unavailable */
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Scanned Traffic"
              className="max-h-[420px] rounded-xl object-contain shadow-md"
            />
          ) : (
            <div className="text-center text-gray-400 text-xs">Awaiting image feed</div>
          )}
        </div>
      )}

      {/* Bottom 3D Helper Hint */}
      <div className="absolute bottom-3 left-3.5 z-10 pointer-events-none flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[11px] text-gray-500 border border-gray-200/80 shadow-xs">
        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
        <span>3D Vision Scanner • Drag to rotate perspective • Scroll to zoom</span>
      </div>
    </div>
  );
};
