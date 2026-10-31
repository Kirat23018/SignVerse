"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import Link from "next/link";

// MediaPipe 21 landmark connections
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

export default function SignToTextClientPage() {
  const [liveText, setLiveText] = useState<string>("");
  const [activeGesture, setActiveGesture] = useState<string>("Waiting for hand...");
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsInstanceRef = useRef<any>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());
  const isProcessingRef = useRef<boolean>(false);

  // Pure geometric landmark evaluation (zero backend, zero ML models)
  const classifyGesture = useCallback((landmarks: any[]) => {
    if (!landmarks || landmarks.length < 21) {
      return { gesture: "No hand in view", text: "" };
    }

    const dist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    const wrist = landmarks[0];
    const thumbMcp = landmarks[2];
    const thumbIp = landmarks[3];
    const thumbTip = landmarks[4];
    const indexMcp = landmarks[5];
    const indexPip = landmarks[6];
    const indexTip = landmarks[8];
    const middleMcp = landmarks[9];
    const middlePip = landmarks[10];
    const middleTip = landmarks[12];
    const ringMcp = landmarks[13];
    const ringPip = landmarks[14];
    const ringTip = landmarks[16];
    const pinkyMcp = landmarks[17];
    const pinkyPip = landmarks[18];
    const pinkyTip = landmarks[20];

    const palmScale = Math.max(dist(wrist, middleMcp), 0.05);

    const isExtended = (mcp: any, pip: any, tip: any) => {
      return (
        dist(wrist, tip) > dist(wrist, pip) * 1.12 &&
        dist(mcp, tip) > dist(mcp, pip) * 1.25 &&
        tip.y < pip.y
      );
    };

    const isIndexExt = isExtended(indexMcp, indexPip, indexTip);
    const isMiddleExt = isExtended(middleMcp, middlePip, middleTip);
    const isRingExt = isExtended(ringMcp, ringPip, ringTip);
    const isPinkyExt = isExtended(pinkyMcp, pinkyPip, pinkyTip);

    const isThumbUp =
      thumbTip.y < thumbIp.y - 0.02 &&
      thumbTip.y < thumbMcp.y - 0.04 &&
      thumbTip.y < indexMcp.y - 0.03 &&
      thumbTip.y < indexTip.y &&
      thumbTip.y < middleTip.y;

    // 1. Thumbs Up -> "Yes"
    if (isThumbUp && !isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt) {
      return { gesture: "Thumbs Up 👍", text: "Yes" };
    }

    // 2. Open Palm -> "Stop"
    if (isIndexExt && isMiddleExt && isRingExt && isPinkyExt) {
      return { gesture: "Open Palm ✋", text: "Stop" };
    }

    // 3. Peace Sign -> "Victory"
    if (isIndexExt && isMiddleExt && !isRingExt && !isPinkyExt && !isThumbUp) {
      const vSep = dist(indexTip, middleTip) / palmScale;
      if (vSep > 0.22) {
        return { gesture: "Peace Sign ✌️", text: "Victory" };
      }
    }

    // 4. Index Finger Up -> "One"
    if (isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt && !isThumbUp) {
      return { gesture: "Index Up ☝️", text: "One" };
    }

    // 5. Fist -> "Rock"
    if (!isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt && !isThumbUp) {
      const indexDist = dist(indexTip, indexMcp) / palmScale;
      const middleDist = dist(middleTip, middleMcp) / palmScale;
      if (indexDist < 0.95 && middleDist < 0.95) {
        return { gesture: "Fist ✊", text: "Rock" };
      }
    }

    return { gesture: "Hand Detected", text: "" };
  }, []);

  const drawSkeleton = useCallback((landmarks: any[], canvas: HTMLCanvasElement, width: number, height: number) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    if (!landmarks || landmarks.length < 21) return;

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#0284c7";

    HAND_CONNECTIONS.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo((1 - p1.x) * width, p1.y * height);
        ctx.lineTo((1 - p2.x) * width, p2.y * height);
        ctx.stroke();
      }
    });

    landmarks.forEach((p, index) => {
      const x = (1 - p.x) * width;
      const y = p.y * height;
      const isFingertip = [4, 8, 12, 16, 20].includes(index);

      ctx.beginPath();
      ctx.arc(x, y, isFingertip ? 5 : 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = isFingertip ? "#f43f5e" : "#ffffff";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#ffffff";
      ctx.fill();
    });
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadMediaPipeHands = async () => {
      try {
        if (!(window as any).Hands) {
          await new Promise<void>((resolve, reject) => {
            const existingScript = document.getElementById("mediapipe-hands-cdn");
            if (existingScript) {
              existingScript.addEventListener("load", () => resolve());
              existingScript.addEventListener("error", reject);
              if ((window as any).Hands) resolve();
              return;
            }

            const script = document.createElement("script");
            script.id = "mediapipe-hands-cdn";
            script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
            script.crossOrigin = "anonymous";
            script.onload = () => resolve();
            script.onerror = (e) => reject(new Error("Failed to load @mediapipe/hands from CDN"));
            document.head.appendChild(script);
          });
        }

        if (isCancelled) return;

        const HandsClass = (window as any).Hands;
        const hands = new HandsClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
          if (isCancelled) return;
          isProcessingRef.current = false;

          const canvas = canvasRef.current;
          const video = webcamRef.current?.video;

          if (canvas && video) {
            const w = canvas.width;
            const h = canvas.height;

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              const firstHand = results.multiHandLandmarks[0];
              drawSkeleton(firstHand, canvas, w, h);

              const res = classifyGesture(firstHand);
              setActiveGesture(res.gesture);
              setLiveText(res.text);
            } else {
              const ctx = canvas.getContext("2d");
              ctx?.clearRect(0, 0, w, h);
              setActiveGesture("Waiting for hand...");
              setLiveText("");
            }
          }

          frameCountRef.current += 1;
          const now = Date.now();
          if (now - lastTimeRef.current >= 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastTimeRef.current = now;
          }
        });

        handsInstanceRef.current = hands;
        setIsModelLoading(false);
      } catch (err) {
        console.error("Client-side MediaPipe initialization error:", err);
        setIsModelLoading(false);
      }
    };

    loadMediaPipeHands();

    return () => {
      isCancelled = true;
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (handsInstanceRef.current) {
        try { handsInstanceRef.current.close(); } catch (e) {}
      }
    };
  }, [classifyGesture, drawSkeleton]);

  useEffect(() => {
    let isActive = true;

    const processVideoFrame = async () => {
      if (!isActive) return;

      const video = webcamRef.current?.video;
      const hands = handsInstanceRef.current;

      if (video && video.readyState >= 2 && hands && !isProcessingRef.current) {
        try {
          isProcessingRef.current = true;
          await hands.send({ image: video });
        } catch (err) {
          isProcessingRef.current = false;
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(processVideoFrame);
    };

    if (!isModelLoading && isCameraReady) {
      animationFrameIdRef.current = requestAnimationFrame(processVideoFrame);
    }

    return () => {
      isActive = false;
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [isModelLoading, isCameraReady]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 pb-32 relative font-sans">
      {/* Top Header */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-xl shadow-lg shadow-sky-500/25">
            🤟
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Sign-to-Text <span className="text-sky-400">Client Engine</span>
            </h1>
            <p className="text-xs text-slate-400">Pure In-Browser MediaPipe Hand Tracking</p>
          </div>
        </div>

        <Link
          href="/translate"
          className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md transition-all"
        >
          3D Avatar Mode →
        </Link>
      </div>

      {/* Glassmorphic Webcam Card */}
      <div className="w-full max-w-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-2xl relative">
        <div className="flex justify-between items-center mb-3 px-1 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                !isModelLoading && isCameraReady ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="font-semibold text-slate-300">
              {isModelLoading ? "Loading MediaPipe..." : isCameraReady ? `Live: ${activeGesture}` : "Starting Camera..."}
            </span>
          </div>

          {!isModelLoading && isCameraReady && (
            <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 font-mono font-bold border border-sky-500/20">
              ~{fps} FPS
            </span>
          )}
        </div>

        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center">
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored={true}
            onUserMedia={() => setIsCameraReady(true)}
            videoConstraints={{ width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }}
            className="w-full h-full object-cover"
          />

          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {(isModelLoading || !isCameraReady) && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
              <p className="text-xs text-slate-300 font-medium">
                {isModelLoading ? "Initializing MediaPipe in Browser..." : "Requesting camera access..."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Live Translation Text Container */}
      <div className="fixed bottom-6 inset-x-0 mx-auto max-w-md px-4 pointer-events-none z-50">
        <div
          className={`pointer-events-auto rounded-3xl p-5 text-center transition-all duration-300 backdrop-blur-3xl shadow-2xl ${
            liveText
              ? "bg-slate-900/95 border-2 border-sky-400/80 shadow-sky-500/25 scale-100"
              : "bg-slate-900/80 border border-white/10 scale-95 opacity-90"
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${liveText ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              {liveText ? activeGesture : "Awaiting Hand Sign..."}
            </span>
          </div>

          <div className="min-h-[44px] flex items-center justify-center">
            {liveText ? (
              <span className="text-4xl font-black tracking-tight bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                &ldquo;{liveText}&rdquo;
              </span>
            ) : (
              <span className="text-xs italic text-slate-500">
                Perform Thumbs Up, Open Palm, Peace, Fist, or Index Up
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
