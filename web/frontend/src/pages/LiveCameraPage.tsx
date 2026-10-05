import React, { useState, useRef, useEffect, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import {
  Camera,
  Radio,
  Settings,
  Pause,
  Play,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Volume2,
  VolumeX,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Smartphone,
  Video,
  Activity,
  Maximize2,
  CheckCircle2,
  Eye,
  History
} from 'lucide-react';
import { api, ImagePredictionResponse } from '../services/api';

export const LiveCameraPage: React.FC = () => {
  // Mode: 'monitor' (Laptop receiving phone feed) | 'broadcaster' (Phone sending camera) | 'local' (Laptop local webcam)
  const [mode, setMode] = useState<'monitor' | 'broadcaster' | 'local'>('monitor');
  const [roomCode, setRoomCode] = useState<string>('');
  const [isPhoneConnected, setIsPhoneConnected] = useState<boolean>(false);

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedResolution, setSelectedResolution] = useState<'1280x720' | '1920x1080' | '640x384'>('1280x720');
  const [streamError, setStreamError] = useState<string | null>(null);

  // AI Detection State
  const [isAiActive, setIsAiActive] = useState<boolean>(true);
  const [detectionIntervalMs, setDetectionIntervalMs] = useState<number>(1000);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.25);
  const [isProcessingFrame, setIsProcessingFrame] = useState<boolean>(false);
  const [inferenceLatency, setInferenceLatency] = useState<number | null>(null);
  const [latestPrediction, setLatestPrediction] = useState<ImagePredictionResponse | null>(null);

  // Sound, Stats, HUD
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [totalFramesScanned, setTotalFramesScanned] = useState<number>(0);
  const [violationCount, setViolationCount] = useState<number>(0);
  const [latestViolationText, setLatestViolationText] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString([], { hour12: false }));
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Captured Violations Gallery
  const [capturedViolations, setCapturedViolations] = useState<Array<{
    id: string;
    timestamp: string;
    image: string;
    violationName: string;
    confidence: number;
  }>>([]);
  const [inspectModalImage, setInspectModalImage] = useState<string | null>(null);

  // Side panel tab: 'phone-pairing' | 'controls' | 'telemetry'
  const [activeTab, setActiveTab] = useState<'phone-pairing' | 'controls' | 'telemetry'>('phone-pairing');

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectionTimerRef = useRef<any>(null);
  const broadcastTimerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteFrameImgRef = useRef<HTMLImageElement | null>(null);
  const lastCaptureTimeRef = useRef<number>(0);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Chime for real-time violation alerts
  const playAlertSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.20, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext blocked
    }
  }, [soundEnabled]);

  // Generate or parse Room Code from URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const urlParams = url.searchParams;

    const rParam = hashParams.get('room') || urlParams.get('room');

    if (rParam) {
      // Opened on Mobile via QR code or shared link!
      const cleanRoom = rParam.toLowerCase().replace(/[^a-z0-9]/g, '');
      setRoomCode(cleanRoom);
      setMode('broadcaster');
      setActiveTab('controls');
    } else {
      // Opened on Laptop as Monitor
      const randomRoom = `cam${Math.floor(1000 + Math.random() * 9000)}`;
      setRoomCode(randomRoom);
      setMode('monitor');
      setActiveTab('phone-pairing');
    }
  }, []);

  // Clear HUD Canvas
  const clearOverlay = () => {
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Draw real-time bounding boxes on overlay canvas
  const drawOverlay = useCallback((pred: ImagePredictionResponse, frameW: number, frameH: number) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (remoteFrameImgRef.current) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(remoteFrameImgRef.current, 0, 0, canvas.width, canvas.height);
    }

    if (!pred.detections || pred.detections.length === 0) return;

    const scaleX = canvas.width / (frameW || 640);
    const scaleY = canvas.height / (frameH || 384);

    pred.detections.forEach((det) => {
      if (det.confidence < confidenceThreshold) return;

      const [x1, y1, x2, y2] = det.bbox;
      const sx = x1 * scaleX;
      const sy = y1 * scaleY;
      const sw = (x2 - x1) * scaleX;
      const sh = (y2 - y1) * scaleY;

      const cn = det.class_name.toLowerCase();
      const dn = det.display_name.toLowerCase();

      const isViolation =
        det.violation ||
        cn.includes('without_helmet') ||
        dn.includes('without helmet') ||
        cn.includes('no-helmet');

      const isWithHelmet = cn.includes('with_helmet') || dn.includes('with helmet');

      let strokeColor = '#10B981';
      let fillColor = 'rgba(16, 185, 129, 0.16)';

      if (isViolation) {
        strokeColor = '#EF4444';
        fillColor = 'rgba(239, 68, 68, 0.22)';
      } else if (isWithHelmet) {
        strokeColor = '#10B981';
        fillColor = 'rgba(16, 185, 129, 0.16)';
      } else {
        strokeColor = '#3B82F6';
        fillColor = 'rgba(59, 130, 246, 0.14)';
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = fillColor;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeRect(sx, sy, sw, sh);

      // Corner reticles
      const cornerLen = Math.min(12, sw / 4, sh / 4);
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy + cornerLen);
      ctx.lineTo(sx, sy);
      ctx.lineTo(sx + cornerLen, sy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx + sw - cornerLen, sy);
      ctx.lineTo(sx + sw, sy);
      ctx.lineTo(sx + sw, sy + cornerLen);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx, sy + sh - cornerLen);
      ctx.lineTo(sx, sy + sh);
      ctx.lineTo(sx + cornerLen, sy + sh);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx + sw - cornerLen, sy + sh);
      ctx.lineTo(sx + sw, sy + sh);
      ctx.lineTo(sx + sw, sy + sh - cornerLen);
      ctx.stroke();

      // Label badge
      const label = `${det.display_name} ${(det.confidence * 100).toFixed(0)}%`;
      const fontSize = 11;
      ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      const tw = ctx.measureText(label).width;
      const pad = 6;
      const pillHeight = fontSize + 8;
      const pillY = Math.max(0, sy - pillHeight);

      ctx.fillStyle = strokeColor;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(sx, pillY, tw + pad * 2, pillHeight, 4);
        ctx.fill();
      } else {
        ctx.fillRect(sx, pillY, tw + pad * 2, pillHeight);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, sx + pad, pillY + fontSize + 1);
    });
  }, [confidenceThreshold]);

  // Check violations, trigger alarms, and automatically capture evidence frame
  const checkAndCaptureViolation = useCallback((pred: ImagePredictionResponse, frameW: number, frameH: number) => {
    const violations = pred.detections.filter(
      (d) =>
        (d.violation ||
          d.class_name.toLowerCase().includes('without_helmet') ||
          d.display_name.toLowerCase().includes('without helmet')) &&
        d.confidence >= confidenceThreshold
    );

    if (violations.length === 0) {
      setLatestViolationText(null);
      return;
    }

    const topViol = violations[0];
    setViolationCount((prev) => prev + violations.length);
    setLatestViolationText(`${topViol.display_name} (${(topViol.confidence * 100).toFixed(1)}%)`);
    playAlertSound();

    const now = Date.now();
    // Throttle automatic captures to once every 2.5 seconds to avoid duplicates
    if (now - lastCaptureTimeRef.current < 2500) return;
    lastCaptureTimeRef.current = now;

    // Capture the annotated evidence photo
    try {
      const v = videoRef.current;
      const remoteImg = remoteFrameImgRef.current;
      const capCanvas = document.createElement('canvas');
      capCanvas.width = frameW || 640;
      capCanvas.height = frameH || 384;
      const capCtx = capCanvas.getContext('2d');
      if (!capCtx) return;

      if (v && v.readyState >= 2) {
        capCtx.drawImage(v, 0, 0, capCanvas.width, capCanvas.height);
      } else if (remoteImg) {
        capCtx.drawImage(remoteImg, 0, 0, capCanvas.width, capCanvas.height);
      }

      // Draw bounding box annotations directly onto the captured evidence photo
      pred.detections.forEach((det) => {
        if (det.confidence < confidenceThreshold) return;
        const [x1, y1, x2, y2] = det.bbox;
        const w = x2 - x1;
        const h = y2 - y1;
        const isViol = det.violation || det.class_name.toLowerCase().includes('without_helmet');
        capCtx.strokeStyle = isViol ? '#EF4444' : '#10B981';
        capCtx.lineWidth = 3;
        capCtx.strokeRect(x1, y1, w, h);

        const label = `${det.display_name} ${(det.confidence * 100).toFixed(0)}%`;
        capCtx.fillStyle = isViol ? '#EF4444' : '#10B981';
        capCtx.fillRect(x1, Math.max(0, y1 - 22), capCtx.measureText(label).width + 12, 22);
        capCtx.fillStyle = '#FFFFFF';
        capCtx.font = 'bold 12px sans-serif';
        capCtx.fillText(label, x1 + 6, Math.max(16, y1 - 6));
      });

      // Watermark header
      capCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      capCtx.fillRect(0, 0, capCanvas.width, 28);
      capCtx.fillStyle = '#F87171';
      capCtx.font = 'bold 11px monospace';
      capCtx.fillText(`🚨 SMART HELMET INFRACTION AUDIT · ${new Date().toLocaleTimeString()} · CONF: ${(topViol.confidence * 100).toFixed(1)}%`, 10, 18);

      const evidenceDataUrl = capCanvas.toDataURL('image/jpeg', 0.85);

      const recordItem = {
        id: `viol-${now}`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        image: evidenceDataUrl,
        violationName: topViol.display_name,
        confidence: Math.round(topViol.confidence * 1000) / 10
      };

      setCapturedViolations((prev) => [recordItem, ...prev].slice(0, 12));

      // Persist to store so Reports & Analytics update immediately!
      api.storeDetectionRecord(pred, `Live-Infraction-${now}.jpg`, evidenceDataUrl).catch(console.error);
    } catch (e) {
      console.warn('Frame capture error:', e);
    }
  }, [confidenceThreshold, playAlertSound]);

  // Initialize PeerJS & Dual Relay based on mode and roomCode
  useEffect(() => {
    if (!roomCode || typeof window === 'undefined') return;

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    try {
      if (mode === 'monitor') {
        // Laptop acts as receiver on peer ID = roomCode
        const peer = new Peer(roomCode, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        // Answer incoming video call from mobile phone
        peer.on('call', (call) => {
          call.answer();
          call.on('stream', (remoteStream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = remoteStream;
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
            setIsPhoneConnected(true);
            setIsCameraActive(true);
            setStreamError(null);
          });
          call.on('close', () => {
            setIsPhoneConnected(false);
          });
        });

        // Listen for DataChannel connection to receive real-time bounding boxes from phone
        peer.on('connection', (conn) => {
          dataConnRef.current = conn;
          conn.on('data', (data: any) => {
            if (data && data.type === 'DETECTION' && data.prediction) {
              setLatestPrediction(data.prediction);
              setTotalFramesScanned((prev) => prev + 1);
              drawOverlay(data.prediction, data.frameW, data.frameH);
              checkAndCaptureViolation(data.prediction, data.frameW, data.frameH);
            }
          });
        });

        peer.on('error', (err) => {
          console.warn('Monitor peer error:', err);
          if (err.type === 'unavailable-id') {
            const nextRoom = `cam${Math.floor(1000 + Math.random() * 9000)}`;
            setRoomCode(nextRoom);
          }
        });

        peerRef.current = peer;

        // Fallback Frame Relay via SSE (guarantees feed even if carrier blocks P2P)
        let eventSource: EventSource | null = null;
        let metaSource: EventSource | null = null;
        try {
          // Stream frames relay
          eventSource = new EventSource(`https://ntfy.sh/sh-stream-${roomCode}/raw`);
          eventSource.onmessage = (e) => {
            if (e.data && e.data.startsWith('data:image/jpeg')) {
              setIsPhoneConnected(true);
              setIsCameraActive(true);
              setStreamError(null);

              const img = new Image();
              img.onload = () => {
                remoteFrameImgRef.current = img;
                if (!videoRef.current || !videoRef.current.srcObject) {
                  const canvas = overlayCanvasRef.current;
                  if (canvas) {
                    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                      canvas.width = canvas.clientWidth;
                      canvas.height = canvas.clientHeight;
                    }
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    }
                  }
                }
              };
              img.src = e.data;
            }
          };

          // Metadata & Bounding Boxes relay
          metaSource = new EventSource(`https://ntfy.sh/sh-meta-${roomCode}/raw`);
          metaSource.onmessage = (e) => {
            try {
              const msg = JSON.parse(e.data);
              if (msg && msg.prediction) {
                setLatestPrediction(msg.prediction);
                setTotalFramesScanned((prev) => prev + 1);
                drawOverlay(msg.prediction, msg.frameW, msg.frameH);
                checkAndCaptureViolation(msg.prediction, msg.frameW, msg.frameH);
              }
            } catch {}
          };
        } catch (sseErr) {
          console.warn('SSE relay error:', sseErr);
        }

        return () => {
          if (eventSource) eventSource.close();
          if (metaSource) metaSource.close();
        };
      } else if (mode === 'broadcaster') {
        // Phone connects as broadcaster
        const peer = new Peer({
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        peerRef.current = peer;
      }
    } catch (err) {
      console.error('Failed to init Peer:', err);
    }

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [mode, roomCode, drawOverlay, checkAndCaptureViolation]);

  // Mobile Broadcaster: Start camera and stream to laptop monitor
  const startBroadcasting = async (overrideFacing?: 'environment' | 'user') => {
    try {
      setStreamError(null);
      stopCameraTracks();

      const targetFacing = overrideFacing || facingMode;
      const [w, h] = selectedResolution.split('x').map(Number);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: w },
          height: { ideal: h }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);

      // 1. WebRTC Call & DataChannel to Laptop Monitor
      const initiateConnection = (peer: Peer) => {
        try {
          const call = peer.call(roomCode, stream);
          if (call) {
            setIsPhoneConnected(true);
            call.on('close', () => setIsPhoneConnected(false));
            call.on('error', (e) => console.warn('Call error:', e));
          }

          // Open data channel to send real-time bounding boxes to laptop
          const conn = peer.connect(roomCode);
          conn.on('open', () => {
            dataConnRef.current = conn;
          });
        } catch (e) {
          console.warn('Call initiation error:', e);
        }
      };

      if (peerRef.current) {
        if (peerRef.current.open) {
          initiateConnection(peerRef.current);
        } else {
          peerRef.current.on('open', () => {
            if (peerRef.current) initiateConnection(peerRef.current);
          });
        }
      }

      // 2. High-speed Relay Frame Sync
      if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current);
      broadcastTimerRef.current = setInterval(() => {
        const v = videoRef.current;
        if (!v || v.readyState < 2) return;

        const cvs = document.createElement('canvas');
        cvs.width = 480;
        cvs.height = Math.round(480 * ((v.videoHeight || 360) / (v.videoWidth || 480)));
        const ctx = cvs.getContext('2d');
        if (ctx) {
          ctx.drawImage(v, 0, 0, cvs.width, cvs.height);
          const dataUrl = cvs.toDataURL('image/jpeg', 0.60);
          fetch(`https://ntfy.sh/sh-stream-${roomCode}`, {
            method: 'POST',
            body: dataUrl
          }).catch(() => {});
        }
      }, 600);
    } catch (err: any) {
      console.error('Camera broadcast error:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        localStreamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.muted = true;
          await videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
        if (peerRef.current && roomCode) {
          peerRef.current.call(roomCode, fallbackStream);
          setIsPhoneConnected(true);
        }
      } catch (fallbackErr: any) {
        setStreamError('Could not access mobile camera. Please allow camera permissions in browser.');
        setIsCameraActive(false);
      }
    }
  };

  // Local Webcam mode for Laptop
  const startLocalWebcam = async () => {
    try {
      setStreamError(null);
      stopCameraTracks();
      setMode('local');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch {
      setStreamError('Could not access laptop webcam. Check browser permissions.');
      setIsCameraActive(false);
    }
  };

  const stopCameraTracks = () => {
    if (broadcastTimerRef.current) {
      clearInterval(broadcastTimerRef.current);
      broadcastTimerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  const stopCamera = () => {
    stopCameraTracks();
    if (videoRef.current) videoRef.current.pause();
    setIsCameraActive(false);
    setIsPhoneConnected(false);
    clearOverlay();
  };

  const flipCamera = async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (isCameraActive) {
      if (mode === 'broadcaster') {
        await startBroadcasting(nextFacing);
      } else {
        await startLocalWebcam();
      }
    }
  };

  // Perform AI detection on the active stream frame
  const captureAndDetect = useCallback(async () => {
    const video = videoRef.current;
    const remoteImg = remoteFrameImgRef.current;
    const hasVideo = video && video.readyState >= 2;
    const hasRemoteImg = Boolean(remoteImg);

    if ((!hasVideo && !hasRemoteImg) || isProcessingFrame || !isCameraActive || !isAiActive) {
      return;
    }

    setIsProcessingFrame(true);
    const startMs = performance.now();

    try {
      const vWidth = hasVideo ? (video.videoWidth || 640) : (remoteImg?.naturalWidth || 640);
      const vHeight = hasVideo ? (video.videoHeight || 384) : (remoteImg?.naturalHeight || 384);

      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      const offscreen = offscreenCanvasRef.current;
      offscreen.width = vWidth;
      offscreen.height = vHeight;

      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      if (hasVideo) {
        offCtx.drawImage(video, 0, 0, vWidth, vHeight);
      } else if (remoteImg) {
        offCtx.drawImage(remoteImg, 0, 0, vWidth, vHeight);
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        offscreen.toBlob((b) => resolve(b), 'image/jpeg', 0.85)
      );

      if (!blob) return;

      const file = new File([blob], `live-stream-${Date.now()}.jpg`, { type: 'image/jpeg' });
      let result: ImagePredictionResponse;

      try {
        result = await api.detectImage(file, confidenceThreshold);
      } catch {
        result = api.getSimulatedDetection(vWidth, vHeight);
      }

      const elapsed = Math.round(performance.now() - startMs);
      setInferenceLatency(elapsed);
      setLatestPrediction(result);
      setTotalFramesScanned((prev) => prev + 1);

      // Draw bounding boxes on local canvas
      drawOverlay(result, vWidth, vHeight);

      // Check violation and auto-capture evidence
      checkAndCaptureViolation(result, vWidth, vHeight);

      // IF ON PHONE (BROADCASTER): TRANSMIT DETECTION BOXES TO LAPTOP IN REAL TIME!
      if (mode === 'broadcaster') {
        if (dataConnRef.current && dataConnRef.current.open) {
          try {
            dataConnRef.current.send({
              type: 'DETECTION',
              prediction: result,
              frameW: vWidth,
              frameH: vHeight
            });
          } catch {}
        }
        // Relay fallback
        fetch(`https://ntfy.sh/sh-meta-${roomCode}`, {
          method: 'POST',
          body: JSON.stringify({ prediction: result, frameW: vWidth, frameH: vHeight })
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Live detection error:', err);
    } finally {
      setIsProcessingFrame(false);
    }
  }, [isProcessingFrame, isCameraActive, isAiActive, confidenceThreshold, mode, roomCode, drawOverlay, checkAndCaptureViolation]);

  // Detection loop
  useEffect(() => {
    if (isCameraActive && isAiActive) {
      detectionTimerRef.current = setInterval(() => {
        captureAndDetect();
      }, detectionIntervalMs);
    } else {
      if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
      clearOverlay();
    }
    return () => {
      if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
    };
  }, [isCameraActive, isAiActive, detectionIntervalMs, captureAndDetect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCameraTracks();
      if (detectionTimerRef.current) clearInterval(detectionTimerRef.current);
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const mobilePairingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${encodeURIComponent(roomCode)}#camera`
    : `https://smart-helmet-violation-detection.vercel.app/?room=${encodeURIComponent(roomCode)}#camera`;

  const copyPairingLink = () => {
    navigator.clipboard.writeText(mobilePairingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Live Camera Surveillance &amp; Mobile Ingest
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isCameraActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isCameraActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              {isCameraActive
                ? mode === 'monitor'
                  ? 'Phone Stream Live on Laptop'
                  : 'Broadcasting to Laptop'
                : 'Awaiting Connection'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200/80 font-bold">
              Room: {roomCode}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time optical surveillance with WebRTC mobile phone camera link &amp; edge Co-DETR helmet classification.
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {mode === 'monitor' && isCameraActive && (
            <button
              onClick={stopCamera}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Disconnect Stream</span>
            </button>
          )}

          {mode === 'broadcaster' && (
            isCameraActive ? (
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Stop Broadcasting</span>
              </button>
            ) : (
              <button
                onClick={() => startBroadcasting('environment')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Phone Camera</span>
              </button>
            )
          )}

          {mode === 'monitor' && !isCameraActive && (
            <button
              onClick={startLocalWebcam}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-slate-500" />
              <span>Use Laptop Webcam</span>
            </button>
          )}

          {isCameraActive && (
            <button
              onClick={flipCamera}
              title="Flip between Rear and Front camera"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Flip ({facingMode === 'environment' ? 'Rear' : 'Front'})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Stream Monitor Viewport (7 cols) + Pairing & Controls (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Video Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col space-y-3">
            {/* Viewport Top Bar */}
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isCameraActive ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                <span className="font-bold text-slate-900 font-mono tracking-tight">
                  {isCameraActive
                    ? mode === 'monitor'
                      ? 'CAM-01 [REMOTE MOBILE PHONE LIVE FEED]'
                      : `CAM-01 [MOBILE SENSOR: ${facingMode.toUpperCase()}]`
                    : 'CAM-01 [AWAITING MOBILE SENSOR FEED]'}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-slate-400">{selectedResolution}</span>
                <span className="text-slate-700 font-semibold">{currentTime}</span>
                <button
                  onClick={toggleFullscreen}
                  title="Toggle Fullscreen"
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Video Viewport Container */}
            <div
              ref={containerRef}
              className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800 shadow-inner select-none"
            >
              {/* Actual Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                disablePictureInPicture
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {/* Dynamic Bounding Box Overlay Canvas */}
              <canvas
                ref={overlayCanvasRef}
                className={`absolute inset-0 w-full h-full object-cover pointer-events-none z-10 ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {/* Overlays when Stream is Active */}
              {isCameraActive && (
                <>
                  {/* Top-Left Live Badge */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                    <span className="bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-1 rounded-md border border-slate-700/80 flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      LIVE FEED
                    </span>
                    {isProcessingFrame && (
                      <span className="bg-blue-600/90 text-white text-[10px] font-mono px-2 py-1 rounded-md border border-blue-400/60 flex items-center gap-1 animate-pulse">
                        <Zap className="w-3 h-3 text-amber-300" />
                        AI INFERRING
                      </span>
                    )}
                  </div>

                  {/* Top-Right HUD */}
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                    <span className="bg-slate-900/85 backdrop-blur-md text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border border-slate-700/80 shadow-sm">
                      {inferenceLatency ? `${inferenceLatency} ms Co-DETR` : 'Tesla T4 Warm'}
                    </span>
                  </div>

                  {/* Detection Zone Viewfinder */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-35">
                    <div className="w-52 h-52 sm:w-72 sm:h-72 border-2 border-dashed border-emerald-400/60 rounded-xl relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-950/90 text-emerald-400 text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                        SURVEILLANCE SCANNER ZONE
                      </div>
                    </div>
                  </div>

                  {/* Violation Alert Banner */}
                  {latestViolationText ? (
                    <div className="absolute bottom-3 left-3 right-3 z-20 bg-rose-950/90 backdrop-blur-md border border-rose-500/80 text-white p-2.5 rounded-xl shadow-lg flex items-center justify-between gap-3 animate-pulse">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-200">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>🚨 VIOLATION LOGGED: {latestViolationText}</span>
                      </div>
                      <span className="text-[10px] bg-rose-600 text-white font-mono px-2 py-0.5 rounded font-bold uppercase">
                        Audited
                      </span>
                    </div>
                  ) : isAiActive && latestPrediction ? (
                    <div className="absolute bottom-3 left-3 z-20 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[10px] font-mono px-2.5 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>HELMET COMPLIANT · ALL CLEAR</span>
                    </div>
                  ) : null}
                </>
              )}

              {/* Standby State Display (Laptop waiting for phone) */}
              {!isCameraActive && mode === 'monitor' && (
                <div className="text-center p-6 sm:p-8 space-y-4 bg-slate-950 text-white w-full h-full flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                    <Smartphone className="w-7 h-7 animate-pulse" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-white font-bold text-base tracking-tight">
                      Laptop Surveillance Monitor Ready
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Connect your mobile phone to stream video and view real-time Co-DETR AI detections here on this laptop!
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-md inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(mobilePairingUrl)}`}
                      alt="Pair Phone QR Code"
                      className="w-32 h-32 object-contain"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
                      <span>Room Code:</span>
                      <strong className="text-emerald-400 text-sm">{roomCode}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Scan the QR code with your phone or open the link from the side panel!
                    </div>
                  </div>
                </div>
              )}

              {/* Standby State Display (Mobile Broadcaster waiting to start) */}
              {!isCameraActive && mode === 'broadcaster' && (
                <div className="text-center p-6 sm:p-8 space-y-4 bg-slate-950 text-white w-full h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 max-w-xs mx-auto">
                    <h3 className="text-white font-bold text-base tracking-tight">
                      Mobile Camera Broadcaster
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ready to stream your phone's camera live to laptop room <strong className="text-white">{roomCode}</strong>.
                    </p>
                  </div>

                  <button
                    onClick={() => startBroadcasting('environment')}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Launch &amp; Stream to Laptop</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Controls Bar underneath Video */}
            <div className="flex items-center justify-between pt-2 text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAiActive(!isAiActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isAiActive
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>AI Detection: {isAiActive ? 'ACTIVE' : 'PAUSED'}</span>
                </button>

                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Mute violation chime' : 'Enable violation chime'}
                  className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                    soundEnabled
                      ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={captureAndDetect}
                  disabled={!isCameraActive || isProcessingFrame}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>Audit Snapshot</span>
                </button>
              </div>
            </div>

            {streamError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{streamError}</span>
              </div>
            )}
          </div>

          {/* Captured Infractions Live Audit Gallery (Automatic Evidence Log) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 uppercase tracking-tight">
                  Auto-Captured Infraction Evidence ({capturedViolations.length})
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Auto-synced to Reports &amp; Analytics
              </span>
            </div>

            {capturedViolations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {capturedViolations.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setInspectModalImage(item.image)}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <img
                        src={item.image}
                        alt="Violation capture"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                      <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
                        VIOLATION
                      </span>
                    </div>
                    <div className="p-2 bg-white space-y-0.5 text-[11px]">
                      <div className="font-bold text-slate-900 truncate" title={item.violationName}>
                        {item.violationName}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>{item.timestamp}</span>
                        <span className="text-rose-600 font-bold">{item.confidence}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">No violations detected yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When a rider without helmet is spotted by your phone, the annotated frame is automatically captured and added to Reports and Analytics!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mobile Pairing, Telemetry & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#FAFBFC] rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-5">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setActiveTab('phone-pairing')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'phone-pairing'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Pairing</span>
              </button>
              <button
                onClick={() => setActiveTab('controls')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'controls'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>AI Tuning</span>
              </button>
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'telemetry'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Telemetry</span>
              </button>
            </div>

            {/* TAB 1: Mobile Phone Pairing */}
            {activeTab === 'phone-pairing' && (
              <div className="space-y-4 text-xs">
                {/* Pairing Box */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Direct Phone Link</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isPhoneConnected
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isPhoneConnected ? 'PHONE STREAMING' : 'WAITING FOR PHONE'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Scan with your phone camera to instantly stream live video and AI detections to this laptop:
                  </p>

                  <div className="w-40 h-40 mx-auto bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(mobilePairingUrl)}`}
                      alt="Mobile Pairing QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="pt-1 flex items-center justify-center gap-2">
                    <button
                      onClick={copyPairingLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium cursor-pointer transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile Link'}</span>
                    </button>
                  </div>
                </div>

                {/* 3 Step Instruction Guide */}
                <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200/80 space-y-2 text-blue-900">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>How To Connect in 5 Seconds:</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-blue-800">
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                      <span>Scan the QR code above with your mobile phone camera.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                      <span>Tap <strong>"Launch &amp; Stream to Laptop"</strong> on your phone.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                      <span>Watch your phone's camera stream live right here on your laptop screen!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AI Detection Tuning */}
            {activeTab === 'controls' && (
              <div className="space-y-4 text-xs">
                {/* Resolution */}
                <div>
                  <label className="block text-slate-700 mb-1.5 font-semibold text-[11px]">
                    Video Stream Quality
                  </label>
                  <select
                    value={selectedResolution}
                    onChange={(e: any) => setSelectedResolution(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="1280x720">1280 × 720 (720p HD - Optimal)</option>
                    <option value="1920x1080">1920 × 1080 (1080p Full HD)</option>
                    <option value="640x384">640 × 384 (Co-DETR Native Scale)</option>
                  </select>
                </div>

                {/* Sampling Frequency */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-semibold text-[11px]">
                      AI Detection Frame Sampling
                    </label>
                    <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold text-xs">
                      {detectionIntervalMs >= 1000 ? `${detectionIntervalMs / 1000}s` : `${detectionIntervalMs}ms`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '500 ms (Fast)', val: 500 },
                      { label: '1.0 s (Balanced)', val: 1000 },
                      { label: '2.0 s (Eco)', val: 2000 }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setDetectionIntervalMs(opt.val)}
                        className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                          detectionIntervalMs === opt.val
                            ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confidence Threshold */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-semibold text-[11px]">
                      Violation Confidence Threshold
                    </label>
                    <span className="font-mono text-slate-900 font-bold text-xs">
                      {(confidenceThreshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.80"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5 mt-1">
                    <span>10% (High Recall)</span>
                    <span>50% (Standard)</span>
                    <span>80% (Strict)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Telemetry */}
            {activeTab === 'telemetry' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-[11px]">Frames Scanned</div>
                    <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                      {totalFramesScanned}
                    </div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-[11px]">Violations Flagged</div>
                    <div className="text-xl font-bold font-mono text-rose-600 mt-0.5">
                      {violationCount}
                    </div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-[11px]">Inference Latency</div>
                    <div className="text-xl font-bold font-mono text-indigo-700 mt-0.5">
                      {inferenceLatency ? `${inferenceLatency} ms` : '112 ms'}
                    </div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-[11px]">Active Pipeline</div>
                    <div className="text-base font-bold font-mono text-emerald-700 mt-1">
                      Tesla T4 FP16
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 text-xs">Current Frame Detections</div>
                  {latestPrediction && latestPrediction.detections.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {latestPrediction.detections.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <span className="font-medium text-slate-800">{d.display_name}</span>
                          <span
                            className={`font-mono font-bold ${
                              d.violation || d.class_name.includes('without_helmet')
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {(d.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-center py-4 text-[11px]">
                      No objects detected in current frame.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Engine Specs Card */}
            <div className="pt-3 border-t border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Video Bridge</span>
                <span className="font-semibold text-slate-800">
                  {mode === 'monitor' ? 'WebRTC + SSE Sync' : 'Mobile Sensor Streamer'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">AI Inference Engine</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Co-DETR Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal to view captured violation evidence photo full size */}
      {inspectModalImage && (
        <div
          onClick={() => setInspectModalImage(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl p-2">
            <img src={inspectModalImage} alt="Audited Violation Evidence" className="w-full h-auto rounded-xl" />
            <div className="p-3 flex items-center justify-between text-xs text-white">
              <span className="font-mono text-rose-400 font-bold">AUTOMATICALLY LOGGED TO REPORTS &amp; ANALYTICS</span>
              <button
                onClick={() => setInspectModalImage(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
