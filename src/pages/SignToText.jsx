import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import {
  loadMediaPipeHandsBundle,
  cleanupCameraResources,
  createFrameDispatcher
} from "../utils/mediapipeLoader";

export default function SignToText() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const dispatcherRef = useRef(createFrameDispatcher({ minIntervalMs: 33 }));
  const lastTextRef = useRef("AWAITING HAND SIGN...");
  const [text, setText] = useState("AWAITING HAND SIGN...");

  useEffect(() => {
    let isUnmounted = false;
    const canvasEl = canvasRef.current;
    const webcamNode = webcamRef.current;

    const startCamera = () => {
      if (cameraRef.current) return;
      const videoElement = webcamRef.current?.video;

      if (videoElement && window.Camera) {
        const camera = new window.Camera(videoElement, {
          onFrame: async () => {
            if (isUnmounted || !handsRef.current) return;
            await dispatcherRef.current.dispatch(webcamRef.current?.video, handsRef.current);
          },
          width: 640,
          height: 480,
        });

        cameraRef.current = camera;
        camera.start();
      }
    };

    const initMediaPipe = async () => {
      try {
        await loadMediaPipeHandsBundle({ withDrawingUtils: true });
      } catch {
        if (!isUnmounted) setText("Failed to load MediaPipe vision engine.");
        return;
      }

      if (isUnmounted || !window.Hands || !window.Camera) {
        return;
      }

      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results) => {
        if (isUnmounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const detected = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
        const nextText = detected ? "Hand Detected! Ready for logic." : "AWAITING HAND SIGN...";
        if (lastTextRef.current !== nextText) {
          lastTextRef.current = nextText;
          setText(nextText);
        }

        if (detected) {
          for (const landmarks of results.multiHandLandmarks) {
            if (window.drawConnectors && window.HAND_CONNECTIONS) {
              window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
                color: "#7CA992",
                lineWidth: 4,
              });
            }
            if (window.drawLandmarks) {
              window.drawLandmarks(ctx, landmarks, {
                color: "#E4EAE6",
                fillColor: "#7CA992",
                radius: 4,
              });
            }
          }
        }
      });

      handsRef.current = hands;
      startCamera();
    };

    initMediaPipe();

    return () => {
      isUnmounted = true;
      cleanupCameraResources({
        camera: cameraRef.current,
        hands: handsRef.current,
        video: webcamNode?.video,
        canvas: canvasEl
      });
      cameraRef.current = null;
      handsRef.current = null;
    };
  }, []);

  const handleUserMedia = () => {
    if (handsRef.current && webcamRef.current?.video && !cameraRef.current && window.Camera) {
      const camera = new window.Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (!handsRef.current) return;
          await dispatcherRef.current.dispatch(webcamRef.current?.video, handsRef.current);
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