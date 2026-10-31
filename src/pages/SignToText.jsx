import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";

export default function SignToText() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const [text, setText] = useState("AWAITING HAND SIGN...");

  useEffect(() => {
    let isUnmounted = false;

    const loadScripts = async () => {
      const injectScript = (src) => {
        return new Promise((resolve) => {
          if (document.querySelector(`script[src="${src}"]`)) return resolve();
          const s = document.createElement("script");
          s.src = src;
          s.crossOrigin = "anonymous";
          s.onload = () => resolve();
          document.head.appendChild(s);
        });
      };

      await injectScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      await injectScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      await injectScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");

      if (isUnmounted) return;
      initMediaPipe();
    };

    const startCamera = () => {
      if (cameraRef.current) return;
      const videoElement = webcamRef.current?.video;

      if (videoElement && window.Camera) {
        const camera = new window.Camera(videoElement, {
          onFrame: async () => {
            if (webcamRef.current?.video && handsRef.current) {
              await handsRef.current.send({ image: webcamRef.current.video });
            }
          },
          width: 640,
          height: 480,
        });

        cameraRef.current = camera;
        camera.start();
      }
    };

    const initMediaPipe = () => {
      if (!window.Hands || !window.Camera) {
        console.warn("MediaPipe CDN scripts loading...");
        return;
      }

      // 1. Hands Initialization with accurate locateFile CDN path
      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      // 2. onResults Callback: debug logs + canvas clearing + drawConnectors & drawLandmarks
      hands.onResults((results) => {
        if (isUnmounted) return;

        // Debug Logs to confirm AI frame processing
        console.log("Landmarks detected:", results.multiHandLandmarks);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          setText("Hand Detected! Ready for logic.");

          for (const landmarks of results.multiHandLandmarks) {
            // Draw skeleton connectors
            if (window.drawConnectors && window.HAND_CONNECTIONS) {
              window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
                color: "#7CA992",
                lineWidth: 4,
              });
            }
            // Draw keypoint landmarks
            if (window.drawLandmarks) {
              window.drawLandmarks(ctx, landmarks, {
                color: "#E4EAE6",
                fillColor: "#7CA992",
                radius: 4,
              });
            }
          }
        } else {
          setText("AWAITING HAND SIGN...");
        }

        ctx.restore();
      });

      handsRef.current = hands;

      // Start camera if webcam is already rendered
      startCamera();
    };

    loadScripts();

    return () => {
      isUnmounted = true;
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch {}
      }
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch {}
      }
    };
  }, []);

  const handleUserMedia = () => {
    if (handsRef.current && webcamRef.current?.video && !cameraRef.current && window.Camera) {
      const camera = new window.Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video && handsRef.current) {
            await handsRef.current.send({ image: webcamRef.current.video });
          }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      camera.start();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-sage-bg text-sage-text p-6">
      <h2 className="text-3xl font-bold mb-6 text-sage-accent">Camera Mode</h2>

      {/* Canvas Overlay: absolutely positioned directly OVER the <video> with higher z-index and matching dimensions */}
      <div className="relative w-[640px] h-[480px] rounded-2xl overflow-hidden border-2 border-sage-accent/40 shadow-lg bg-black">
        <Webcam
          ref={webcamRef}
          onUserMedia={handleUserMedia}
          videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full z-20 pointer-events-none"
        />
      </div>

      <div className="mt-8 text-xl bg-sage-surface px-6 py-4 rounded-xl border border-white/10 text-sage-muted shadow-sm">
        {text}
      </div>
    </div>
  );
}