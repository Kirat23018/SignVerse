import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Webcam from "react-webcam";
import { Link, useSearchParams } from "react-router-dom";
import * as tf from "@tensorflow/tfjs";
import { SIGN_TO_TEXT_TRACK } from "../data/dualTrackCourses";
import { isProUnlocked } from "../utils/subscriptionManager";
import UnlockProModal from "../components/UnlockProModal";
import {
  TARGET_SENTENCES,
  detectSentenceComponent,
  checkTokenMatchesStep
} from "../utils/sentenceEngine";

// MediaPipe 21 hand landmark connections
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb 
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index 
  [5, 9], [9, 10], [10, 11], [11, 12],  // Middle 
  [9, 13], [13, 14], [14, 15], [15, 16],// Ring   
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky  
  [0, 17]                               // Palm base
];

// The 5 Target Static Signs with detailed instructions (Strict Hand-Only)
const TARGET_SIGNS = [
  { 
    id: "yes", 
    label: "Yes", 
    gesture: "Thumbs Up", 
    tag: "THUMB", 
    hint: "Thumb pointing straight up, 4 fingers folded tightly into palm.",
    instruction: "Make a tight fist, then extend your thumb straight up toward the ceiling. Keep knuckles facing the camera."
  },
  { 
    id: "one", 
    label: "One", 
    gesture: "Index Finger Up", 
    tag: "INDEX", 
    hint: "Index finger pointing up, middle, ring, pinky curled.",
    instruction: "Extend only your index finger vertically. Keep thumb resting over the curled middle finger."
  },
  { 
    id: "victory", 
    label: "Victory", 
    gesture: "Peace Sign", 
    tag: "PEACE", 
    hint: "Index & Middle extended in a distinct V-shape.",
    instruction: "Extend both your index and middle fingers in a V-shape. Keep ring and pinky fingers folded into palm."
  },
  { 
    id: "rock", 
    label: "Rock", 
    gesture: "Fist", 
    tag: "FIST", 
    hint: "All 5 fingers curled tightly into a fist.",
    instruction: "Curl all four fingers flush against your palm base with your thumb wrapped over the outer knuckles."
  },
  { 
    id: "stop", 
    label: "Stop", 
    gesture: "Open Palm", 
    tag: "PALM", 
    hint: "All 5 fingers fully extended facing camera.",
    instruction: "Hold your entire palm flat facing the webcam with all 5 fingers spread naturally upright."
  }
];

const DEFAULT_MODEL_CLASSES = [
  "Hello", "Thank You", "Yes", "Stop", "Victory",
  "One", "Rock", "Please", "Help", "Love"
];

export default function LiveCam() {
  const [searchParams] = useSearchParams();
  const moduleParam = searchParams.get("module");
  const drillParam = searchParams.get("drill");
  const targetParam = searchParams.get("target");

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const handsInstanceRef = useRef(null);
  const lastRecognizedRef = useRef("");
  const holdCountRef = useRef(0);

  // ================= TENSORFLOW.JS LSTM SEQUENCE STATE =================
  const tfModelRef = useRef(null);
  const sequenceBufferRef = useRef([]); // sliding buffer of 30 frames * 63 features
  const isPredictingRef = useRef(false);
  const [isTfModelLoaded, setIsTfModelLoaded] = useState(false);
  const [modelStatus, setModelStatus] = useState("Loading TensorFlow.js LSTM...");
  const [modelClasses, setModelClasses] = useState(DEFAULT_MODEL_CLASSES);
  const [dlPrediction, setDlPrediction] = useState({ word: "", confidence: 0 });
  const [bufferLength, setBufferLength] = useState(0);

  // Pro & Paywall state
  const [isPro, setIsPro] = useState(isProUnlocked());
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Active module context if launched from courses
  const currentModule = useMemo(() => {
    if (!moduleParam) return null;
    return SIGN_TO_TEXT_TRACK.find((m) => m.id === moduleParam) || null;
  }, [moduleParam]);

  const isModuleLocked = currentModule && currentModule.isLocked && !isPro;

  // Active Target Sign for Lesson Challenge Validation
  const [expectedTarget, setExpectedTarget] = useState(() => {
    if (targetParam) {
      const match = TARGET_SIGNS.find((s) => s.label.toLowerCase() === targetParam.toLowerCase() || targetParam.toLowerCase().includes(s.label.toLowerCase()));
      if (match) return match.label;
    }
    return "Yes";
  });

  const [status, setStatus] = useState("Initializing MediaPipe CDN...");
  const [liveText, setLiveText] = useState("");
  const [activeSignId, setActiveSignId] = useState("");
  const [activeGesture, setActiveGesture] = useState("Awaiting Hand Sign...");
  const [confidence, setConfidence] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [fps, setFps] = useState(0);
  const [history, setHistory] = useState([]);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [detectedHandsCount, setDetectedHandsCount] = useState(0);
  const [detectedHandTypes, setDetectedHandTypes] = useState([]); // ["Left", "Right"]

  // Validation Success state
  const [targetMatchCount, setTargetMatchCount] = useState(0);
  const [isTargetValidated, setIsTargetValidated] = useState(false);
  const [validationToast, setValidationToast] = useState("");

  // ================= RECOGNITION MODES =================
  // Mode A: "word" (Existing 5 static signs) | Mode B: "sentence" (Multi-sign temporal sequence)
  const [recognitionMode, setRecognitionMode] = useState("word");

  // ================= SENTENCE RECOGNITION STATE (MODE B) =================
  const [selectedSentenceId, setSelectedSentenceId] = useState("sent_love_forever");
  const [detectedSequence, setDetectedSequence] = useState([]); // [{ token, label, icon, time }]
  const [completedSentence, setCompletedSentence] = useState(null); // { english, dialect, linguisticNotes, time, tokens }
  const [sentenceStatus, setSentenceStatus] = useState("Ready. Perform first sign in sequence.");
  const [activeCandidateToken, setActiveCandidateToken] = useState(null);

  // Read dynamic camera, tracking sensitivity & hand preferences from Settings
  const [userSettings, setUserSettings] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('signverse_user_settings'));
      return {
        cameraId: s?.cameraId || '',
        trackingConfidence: parseFloat(s?.trackingConfidence) || 0.65,
        handPreference: s?.handPreference || 'right',
        showSkeleton: s?.skeletonOverlay ?? true,
        cameraMirror: s?.cameraMirror ?? true
      };
    } catch {
      return {
        cameraId: '',
        trackingConfidence: 0.65,
        handPreference: 'right',
        showSkeleton: true,
        cameraMirror: true
      };
    }
  });

  // ================= 1. LOAD CUSTOM TENSORFLOW.JS LSTM MODEL =================
  useEffect(() => {
    let isMounted = true;

    const loadCustomTfModel = async () => {
      try {
        setModelStatus("Initializing TensorFlow.js WebGL...");
        await tf.ready();
        setModelStatus("Loading custom model.json...");

        // Attempt fetching class metadata
        try {
          const metaRes = await fetch("/models/metadata.json");
          if (metaRes.ok) {
            const meta = await metaRes.json();
            if (meta.classes && Array.isArray(meta.classes)) {
              setModelClasses(meta.classes);
            }
          }
        } catch (e) {
          console.warn("Metadata load fallback:", e);
        }

        // Load TensorFlow.js LayersModel
        const model = await tf.loadLayersModel("/models/model.json");
        if (!isMounted) return;

        tfModelRef.current = model;
        setIsTfModelLoaded(true);
        setModelStatus("Custom LSTM Model Active (WebGL)");
        console.log("[SignVerse] Custom LSTM Model successfully loaded into TensorFlow.js runtime.");
      } catch (err) {
        console.warn("[SignVerse] TensorFlow.js model load notice:", err);
        if (isMounted) {
          setModelStatus("Custom Model Ready (Fallback Mode)");
          setIsTfModelLoaded(true);
        }
      }
    };

    loadCustomTfModel();

    return () => {
      isMounted = false;
      if (tfModelRef.current) {
        try {
          tfModelRef.current.dispose();
        } catch {}
      }
    };
  }, []);

  // Listen for user settings & subscription updates
  useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        const s = JSON.parse(localStorage.getItem('signverse_user_settings'));
        if (s) {
          setUserSettings({
            cameraId: s.cameraId || '',
            trackingConfidence: parseFloat(s.trackingConfidence) || 0.65,
            handPreference: s.handPreference || 'right',
            showSkeleton: s.skeletonOverlay ?? true,
            cameraMirror: s.cameraMirror ?? true
          });
          if (typeof s.skeletonOverlay === 'boolean') {
            setShowSkeleton(s.skeletonOverlay);
          }
        }
      } catch {}
    };

    const handleSubUpdate = () => {
      setIsPro(isProUnlocked());
    };

    window.addEventListener('signverse_settings_updated', handleSettingsUpdate);
    window.addEventListener('signverse_subscription_updated', handleSubUpdate);
    return () => {
      window.removeEventListener('signverse_settings_updated', handleSettingsUpdate);
      window.removeEventListener('signverse_subscription_updated', handleSubUpdate);
    };
  }, []);

  // Update expected target if URL param updates
  useEffect(() => {
    if (targetParam) {
      const match = TARGET_SIGNS.find((s) => s.label.toLowerCase() === targetParam.toLowerCase() || targetParam.toLowerCase().includes(s.label.toLowerCase()));
      if (match) {
        setExpectedTarget(match.label);
        setTargetMatchCount(0);
        setIsTargetValidated(false);
      }
    }
  }, [targetParam]);

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  // 2. Pure Geometric Landmark Gesture Classifier (Instantaneous fallback)
  const detectGesture = useCallback((landmarks) => {
    if (!landmarks || landmarks.length < 21) {
      return { id: "", gesture: "No Hand in View", text: "", conf: 0 };
    }

    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

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

    // Reference Palm Scale for distance invariance
    const palmScale = Math.max(dist(wrist, middleMcp), 0.05);

    // Check if a finger is extended
    const isExtended = (mcp, pip, tip) => {
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

    // Thumb pointing upward
    const isThumbUp =
      thumbTip.y < thumbIp.y - 0.02 &&
      thumbTip.y < thumbMcp.y - 0.04 &&
      thumbTip.y < indexMcp.y - 0.03 &&
      thumbTip.y < indexTip.y &&
      thumbTip.y < middleTip.y;

    // 1. "Yes" (Thumbs Up)
    if (isThumbUp && !isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt) {
      return { id: "yes", gesture: "Thumbs Up", text: "Yes", conf: 0.98 };
    }

    // 2. "Stop" (Open Palm)
    if (isIndexExt && isMiddleExt && isRingExt && isPinkyExt) {
      return { id: "stop", gesture: "Open Palm", text: "Stop", conf: 0.96 };
    }

    // 3. "Victory" (Peace Sign)
    if (isIndexExt && isMiddleExt && !isRingExt && !isPinkyExt && !isThumbUp) {
      const vSep = dist(indexTip, middleTip) / palmScale;
      if (vSep > 0.20) {
        return { id: "victory", gesture: "Peace Sign", text: "Victory", conf: 0.95 };
      }
    }

    // 4. "One" (Index Finger Up)
    if (isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt && !isThumbUp) {
      return { id: "one", gesture: "Index Finger Up", text: "One", conf: 0.94 };
    }

    // 5. "Rock" (Fist)
    if (!isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt && !isThumbUp) {
      const indexDist = dist(indexTip, indexMcp) / palmScale;
      const middleDist = dist(middleTip, middleMcp) / palmScale;
      if (indexDist < 0.95 && middleDist < 0.95) {
        return { id: "rock", gesture: "Fist", text: "Rock", conf: 0.92 };
      }
    }

    return { id: "", gesture: "Tracking Hand", text: "", conf: 0.4 };
  }, []);

  // 3. Draw Skeleton Overlay onto Canvas (Supports up to 2 hands simultaneously)
  const drawSkeleton = useCallback((multiHands, multiHandedness, canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dynamically match canvas internal width/height to active video stream resolution
    const video = webcamRef.current?.video;
    if (video && video.videoWidth && video.videoHeight) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showSkeleton || !multiHands || multiHands.length === 0) {
      ctx.restore();
      return;
    }

    const w = canvas.width;
    const h = canvas.height;
    const isMirrored = userSettings.cameraMirror;

    // Process each detected hand independently
    multiHands.forEach((landmarks, handIndex) => {
      if (!landmarks || landmarks.length < 21) return;
      const isSecondHand = handIndex === 1;
      const rawHandedness = multiHandedness?.[handIndex]?.label;
      const handLabel = rawHandedness ? `${rawHandedness} Hand` : (handIndex === 0 ? "Hand 1" : "Hand 2");

      // Hand 1: Emerald Green (#10b981 / #34d399) | Hand 2: Sky Cyan (#38bdf8 / #7dd3fc)
      const boneColor = isSecondHand ? "#38bdf8" : "#10b981";
      const boneGlow = isSecondHand ? "#0284c7" : "#059669";
      const tipColor = isSecondHand ? "#7dd3fc" : "#34d399";

      ctx.strokeStyle = boneColor;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowBlur = 8;
      ctx.shadowColor = boneGlow;

      // Draw bone connections
      HAND_CONNECTIONS.forEach(([i, j]) => {
        const p1 = landmarks[i];
        const p2 = landmarks[j];
        if (p1 && p2) {
          ctx.beginPath();
          const x1 = isMirrored ? (1 - p1.x) * w : p1.x * w;
          const y1 = p1.y * h;
          const x2 = isMirrored ? (1 - p2.x) * w : p2.x * w;
          const y2 = p2.y * h;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });

      // Draw joint nodes
      landmarks.forEach((p, index) => {
        const x = isMirrored ? (1 - p.x) * w : p.x * w;
        const y = p.y * h;
        const isTip = [4, 8, 12, 16, 20].includes(index);

        ctx.beginPath();
        ctx.arc(x, y, isTip ? 6 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = isTip ? tipColor : "#ffffff";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#ffffff";
        ctx.fill();
      });

      // Draw clean text hand label near the wrist
      const wrist = landmarks[0];
      if (wrist) {
        const wx = isMirrored ? (1 - wrist.x) * w : wrist.x * w;
        const wy = Math.max(wrist.y * h - 14, 18);
        ctx.font = "bold 11px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = boneColor;
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.fillText(handLabel.toUpperCase(), Math.max(10, wx - 26), wy);
      }
    });

    ctx.restore();
  }, [showSkeleton, userSettings.cameraMirror]);

  // Keep live references to prevent camera tears/restarts when predictions update
  const drawSkeletonRef = useRef(drawSkeleton);
  drawSkeletonRef.current = drawSkeleton;

  const detectGestureRef = useRef(detectGesture);
  detectGestureRef.current = detectGesture;

  const expectedTargetRef = useRef(expectedTarget);
  expectedTargetRef.current = expectedTarget;

  const isTargetValidatedRef = useRef(isTargetValidated);
  isTargetValidatedRef.current = isTargetValidated;

  const drillParamRef = useRef(drillParam);
  drillParamRef.current = drillParam;

  const dlPredictionRef = useRef(dlPrediction);
  dlPredictionRef.current = dlPrediction;

  const modelClassesRef = useRef(modelClasses);
  modelClassesRef.current = modelClasses;

  // Sentence recognition refs (prevent camera restart on sequence update)
  const recognitionModeRef = useRef(recognitionMode);
  recognitionModeRef.current = recognitionMode;

  const selectedSentenceIdRef = useRef(selectedSentenceId);
  selectedSentenceIdRef.current = selectedSentenceId;

  const detectedSequenceRef = useRef(detectedSequence);
  detectedSequenceRef.current = detectedSequence;

  const completedSentenceRef = useRef(completedSentence);
  completedSentenceRef.current = completedSentence;

  // Temporal debounce, transition detection, and cooldown refs
  const candTokenRef = useRef(null);
  const candTokenFramesRef = useRef(0);
  const canAcceptNextTokenRef = useRef(true);
  const sentenceCooldownUntilRef = useRef(0);

  const resetSentenceSequence = useCallback(() => {
    setDetectedSequence([]);
    detectedSequenceRef.current = [];
    setCompletedSentence(null);
    completedSentenceRef.current = null;
    setActiveCandidateToken(null);
    candTokenRef.current = null;
    candTokenFramesRef.current = 0;
    canAcceptNextTokenRef.current = true;
    sentenceCooldownUntilRef.current = 0;
    setSentenceStatus("Sequence reset. Ready for the first sign.");
    setLiveText("");
  }, []);

  const speakSentence = useCallback((text) => {
    if ("speechSynthesis" in window && text) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      } catch (err) {
        console.warn("Speech synthesis error:", err);
      }
    }
  }, []);

  // 4. MediaPipe CDN Loader & 30-Frame Sequence Ingestion
  useEffect(() => {
    let isUnmounted = false;
    const canvasEl = canvasRef.current;

    const loadScriptSafely = (src, globalCheck) => {
      return new Promise((resolve, reject) => {
        if (globalCheck()) return resolve();
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          if (globalCheck()) return resolve();
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", (e) => reject(e));
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = () => resolve();
        script.onerror = (err) => {
          console.error(`[SignVerse MediaPipe] Failed to load CDN script: ${src}`, err);
          reject(err);
        };
        document.head.appendChild(script);
      });
    };

    const initMediaPipeCDN = async () => {
      try {
        setStatus("Loading MediaPipe Camera...");
        await loadScriptSafely(
          "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
          () => !!window.Camera
        );

        setStatus("Loading MediaPipe Hands...");
        await loadScriptSafely(
          "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
          () => !!window.Hands
        );

        if (isUnmounted) return;
        setStatus("Initializing Hand Detector...");

        if (!window.Hands) {
          console.error("[SignVerse MediaPipe] window.Hands is not available on window object. CDN script may have failed to load.");
          throw new Error("window.Hands global not found");
        }
        if (!window.Camera) {
          console.error("[SignVerse MediaPipe] window.Camera is not available on window object. Camera Utils CDN script may have failed to load.");
          throw new Error("window.Camera global not found");
        }

        const hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        // ================= MediaPipe onResults Callback (Multi-Hand) =================
        hands.onResults((results) => {
          if (isUnmounted) return;
          const canvas = canvasRef.current;
          const multiHands = results?.multiHandLandmarks || [];
          const multiHandedness = results?.multiHandedness || [];
          const handCount = multiHands.length;

          setDetectedHandsCount(handCount);
          const handLabels = multiHandedness.map((h, i) => h.label ? `${h.label} Hand` : `Hand ${i + 1}`);
          setDetectedHandTypes(handLabels);

          if (handCount > 0) {
            drawSkeletonRef.current(multiHands, multiHandedness, canvas);

            const primaryLandmarks = multiHands[0];
            const secondaryLandmarks = multiHands[1] || null;

            // ================= 30-FRAME SEQUENCE COLLECTION =================
            const frameLandmarks = [];
            for (let i = 0; i < 21; i++) {
              const p = primaryLandmarks[i];
              frameLandmarks.push(p.x, p.y, p.z || 0.0);
            }

            sequenceBufferRef.current.push(frameLandmarks);
            if (sequenceBufferRef.current.length > 30) {
              sequenceBufferRef.current.shift();
            }
            setBufferLength(sequenceBufferRef.current.length);

            // ================= TENSORFLOW.JS LSTM INFERENCE =================
            if (
              tfModelRef.current &&
              !isPredictingRef.current &&
              sequenceBufferRef.current.length === 30
            ) {
              isPredictingRef.current = true;
              const currentSequence = [...sequenceBufferRef.current];

              (async () => {
                try {
                  const inputTensor = tf.tidy(() => {
                    return tf.tensor3d([currentSequence], [1, 30, 63], "float32");
                  });

                  const predictionOutput = tfModelRef.current.predict(inputTensor);
                  const probabilities = await predictionOutput.data();
                  inputTensor.dispose();
                  predictionOutput.dispose();

                  let maxProb = 0;
                  let maxClassIdx = -1;
                  for (let i = 0; i < probabilities.length; i++) {
                    if (probabilities[i] > maxProb) {
                      maxProb = probabilities[i];
                      maxClassIdx = i;
                    }
                  }

                  const activeClasses = modelClassesRef.current;
                  if (maxClassIdx >= 0 && maxProb >= 0.35 && activeClasses[maxClassIdx]) {
                    const predictedWord = activeClasses[maxClassIdx];
                    setDlPrediction({ word: predictedWord, confidence: maxProb });

                    const curTarget = expectedTargetRef.current;
                    if (curTarget && predictedWord.toLowerCase() === curTarget.toLowerCase()) {
                      setTargetMatchCount((prev) => {
                        const updated = prev + 1;
                        if (updated >= 3 && !isTargetValidatedRef.current) {
                          setIsTargetValidated(true);
                          setValidationToast(`Target "${curTarget}" validated (+50 XP)`);
                        }
                        return updated;
                      });
                    }
                  }
                } catch (predErr) {
                  console.warn("[SignVerse TensorFlow.js] Prediction error:", predErr);
                } finally {
                  isPredictingRef.current = false;
                }
              })();
            }

            // ================= BRANCH BY RECOGNITION MODE =================
            if (recognitionModeRef.current === "sentence") {
              // ================= MODE B: TEMPORAL SENTENCE RECOGNITION =================
              const now = Date.now();
              const activeDl = dlPredictionRef.current;
              // Detect custom sentence components supporting single or two hands
              const comp = detectSentenceComponent(primaryLandmarks, activeDl.word, secondaryLandmarks);

              // If currently in cooldown after full sentence completion, hold current display
              if (now < sentenceCooldownUntilRef.current) {
                // In cooldown
              } else if (comp.token && comp.conf >= 0.70) {
                setActiveCandidateToken(comp);
                setActiveGesture(comp.label);
                setLiveText(comp.label);
                setConfidence(comp.conf);

                // Debounce consecutive frames
                if (candTokenRef.current === comp.token) {
                  candTokenFramesRef.current += 1;
                } else {
                  candTokenRef.current = comp.token;
                  candTokenFramesRef.current = 1;
                }

                // If held stably for at least 5 frames and hand transition condition met:
                if (candTokenFramesRef.current >= 5 && canAcceptNextTokenRef.current) {
                  const activeSentence =
                    TARGET_SENTENCES.find((s) => s.id === selectedSentenceIdRef.current) ||
                    TARGET_SENTENCES[0];
                  const currentSeq = detectedSequenceRef.current;
                  const nextStepIndex = currentSeq.length;
                  const targetStep = activeSentence.tokens[nextStepIndex];

                  if (targetStep && checkTokenMatchesStep(comp.token, targetStep)) {
                    // Valid next step in sentence!
                    const updatedSeq = [
                      ...currentSeq,
                      {
                        token: comp.token,
                        label: targetStep.label,
                        badge: targetStep.badge || `STEP ${nextStepIndex + 1}`,
                        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      }
                    ];
                    detectedSequenceRef.current = updatedSeq;
                    setDetectedSequence(updatedSeq);
                    canAcceptNextTokenRef.current = false; // Require physical transition before accepting next sign

                    if (updatedSeq.length === activeSentence.tokens.length) {
                      // FULL SENTENCE RECOGNIZED!
                      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                      const resSentence = {
                        english: activeSentence.english,
                        dialect: activeSentence.dialect,
                        linguisticNotes: activeSentence.linguisticNotes,
                        time: timeStr,
                        tokens: updatedSeq
                      };
                      completedSentenceRef.current = resSentence;
                      setCompletedSentence(resSentence);
                      setSentenceStatus(`Sentence Recognized: "${activeSentence.english}"`);
                      sentenceCooldownUntilRef.current = now + 3000;

                      // Log to history
                      setHistory((prev) => [
                        {
                          text: activeSentence.english,
                          time: timeStr,
                          gesture: `ISL: ${activeSentence.tokens.map((t) => t.id).join(" -> ")}`
                        },
                        ...prev.slice(0, 14)
                      ]);

                      // Audio speech readout
                      speakSentence(activeSentence.english);
                    } else {
                      const nextTarget = activeSentence.tokens[updatedSeq.length];
                      setSentenceStatus(
                        `Step ${updatedSeq.length}/${activeSentence.tokens.length} matched: "${targetStep.label}". Release hand, then perform "${nextTarget.label}".`
                      );
                    }
                  } else {
                    if (targetStep) {
                      setSentenceStatus(
                        `Detected "${comp.label}". Expected next: "${targetStep.label}".`
                      );
                    }
                  }
                }
              } else {
                // Hand in view but not in target sign pose -> Transition detected!
                candTokenRef.current = null;
                candTokenFramesRef.current = 0;
                canAcceptNextTokenRef.current = true;
                setActiveCandidateToken(null);
                if (!completedSentenceRef.current) {
                  setLiveText("");
                }
              }
            } else {
              // ================= MODE A: INSTANT GEOMETRIC CLASSIFIER (5 WORDS) =================
              // Test primary hand and secondary hand (supports single-hand or two-hand signing)
              let res = detectGestureRef.current(primaryLandmarks);
              const res2 = secondaryLandmarks ? detectGestureRef.current(secondaryLandmarks) : null;

              if (res2 && res2.id && res2.id === res.id) {
                res = { ...res, gesture: `${res.gesture} (Two Hands)`, conf: 0.99 };
              } else if (!res.id && res2 && res2.id) {
                res = res2;
              }

              setActiveGesture(res.gesture);

              const activeDl = dlPredictionRef.current;
              const activeText = (activeDl.confidence > 0.65 && activeDl.word) ? activeDl.word : res.text;
              setLiveText(activeText);
              setActiveSignId(res.id);
              setConfidence(Math.max(res.conf, activeDl.confidence));

              const curExpected = expectedTargetRef.current;
              if (activeText && curExpected) {
                const isMatch = activeText.toLowerCase() === curExpected.toLowerCase();
                if (isMatch) {
                  setTargetMatchCount((prev) => {
                    const updated = prev + 1;
                    if (updated >= 3 && !isTargetValidatedRef.current) {
                      setIsTargetValidated(true);
                      setValidationToast(`Success! "${curExpected}" gesture validated (+50 XP)`);

                      const curDrill = drillParamRef.current;
                      if (curDrill) {
                        try {
                          const saved = localStorage.getItem("signverse_completed_lessons");
                          const list = saved ? JSON.parse(saved) : [];
                          if (!list.includes(curDrill)) {
                            list.push(curDrill);
                            localStorage.setItem("signverse_completed_lessons", JSON.stringify(list));
                          }
                        } catch {}
                      }
                    }
                    return updated;
                  });
                }
              }

              if (activeText) {
                if (activeText === lastRecognizedRef.current) {
                  holdCountRef.current += 1;
                  if (holdCountRef.current === 4) {
                    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                    setHistory((prev) => [{ text: activeText, time: timeStr, gesture: res.gesture }, ...prev.slice(0, 14)]);
                  }
                } else {
                  lastRecognizedRef.current = activeText;
                  holdCountRef.current = 1;
                }
              }
            }
          } else {
            if (canvas) {
              const ctx = canvas.getContext("2d");
              ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
            setActiveGesture("Awaiting Hand Sign...");
            setLiveText("");
            setActiveSignId("");
            setConfidence(0);

            // Natural transition: hand lowered or moved outside frame
            candTokenRef.current = null;
            candTokenFramesRef.current = 0;
            canAcceptNextTokenRef.current = true;
            setActiveCandidateToken(null);

            if (sequenceBufferRef.current.length > 0) {
              sequenceBufferRef.current.shift();
              setBufferLength(sequenceBufferRef.current.length);
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

        // Start camera feed once video stream is ready
        let retryCount = 0;
        const checkVideoAndStart = () => {
          if (isUnmounted) return;
          const video = webcamRef.current?.video;
          if (video && video.readyState >= 2) {
            console.log("[SignVerse Camera] Video element ready. Starting Camera stream...");
            const camera = new window.Camera(video, {
              onFrame: async () => {
                if (isUnmounted || !handsInstanceRef.current) return;
                try {
                  if (video && video.readyState >= 2 && !video.paused) {
                    await handsInstanceRef.current.send({ image: video });
                  }
                } catch (frameErr) {
                  console.error("[SignVerse Camera] Frame processing error in hands.send:", frameErr);
                }
              },
              width: 640,
              height: 480
            });

            camera.start()
              .then(() => {
                if (!isUnmounted) {
                  setIsReady(true);
                  setStatus("MediaPipe Active");
                  console.log("[SignVerse Camera] Camera stream started successfully.");
                }
              })
              .catch((camErr) => {
                console.error("[SignVerse Camera] Failed to start camera stream:", camErr);
                if (!isUnmounted) setStatus("Camera start error. Check webcam permissions.");
              });

            cameraInstanceRef.current = camera;
          } else {
            retryCount++;
            if (retryCount < 50) {
              setTimeout(checkVideoAndStart, 150);
            } else {
              console.warn("[SignVerse Camera] Timed out waiting for webcam video stream.");
              if (!isUnmounted) setStatus("Webcam stream timeout. Check camera permissions.");
            }
          }
        };

        checkVideoAndStart();
      } catch (err) {
        console.error("[SignVerse MediaPipe] MediaPipe initialization error:", err);
        if (!isUnmounted) setStatus("MediaPipe Load Error. Check network.");
      }
    };

    initMediaPipeCDN();

    return () => {
      isUnmounted = true;
      if (cameraInstanceRef.current) {
        try {
          cameraInstanceRef.current.stop();
          console.log("[SignVerse Camera] Camera stopped on unmount.");
        } catch (e) {
          console.warn("[SignVerse Camera] Error stopping camera on unmount:", e);
        }
        cameraInstanceRef.current = null;
      }
      if (handsInstanceRef.current) {
        try {
          handsInstanceRef.current.close();
          console.log("[SignVerse MediaPipe] Hands closed on unmount.");
        } catch (e) {
          console.warn("[SignVerse MediaPipe] Error closing hands instance on unmount:", e);
        }
        handsInstanceRef.current = null;
      }
      if (canvasEl) {
        const ctx = canvasEl.getContext("2d");
        ctx?.clearRect(0, 0, canvasEl.width, canvasEl.height);
      }
    };
  }, [userSettings.cameraId, userSettings.trackingConfidence]);

  const clearHistory = () => {
    setHistory([]);
    lastRecognizedRef.current = "";
    holdCountRef.current = 0;
  };

  const activeTargetData = TARGET_SIGNS.find((s) => s.label.toLowerCase() === expectedTarget.toLowerCase()) || TARGET_SIGNS[0];
  const activeSentenceData = TARGET_SENTENCES.find((s) => s.id === selectedSentenceId) || TARGET_SENTENCES[0];

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 56px)',
        backgroundColor: '#191C1A',
        color: '#E4EAE6',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '24px 20px 80px',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      <div style={{ maxWidth: '1360px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* ================= HEADER BAR ================= */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#9CAEA4' }}>
              <Link to="/" style={{ color: '#7CA992', textDecoration: 'none', fontWeight: '600' }}>Home</Link>
              <span>/</span>
              <Link to="/courses" style={{ color: '#7CA992', textDecoration: 'none', fontWeight: '600' }}>Courses</Link>
              <span>/</span>
              <span style={{ color: '#E4EAE6' }}>{currentModule ? currentModule.title : 'Live Camera Studio'}</span>
            </div>

            <h1 style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: '900', color: '#E4EAE6', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span>Live Camera Translator</span>
              <span style={{ fontSize: '12px', fontWeight: '800', background: 'rgba(124, 169, 146, 0.16)', color: '#7CA992', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(124, 169, 146, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7CA992', display: 'inline-block' }} />
                <span>DEEP LEARNING LSTM • TFJS</span>
              </span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/courses"
              style={{
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#E4EAE6',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              ← Back to Courses
            </Link>

            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              style={{
                background: showSkeleton ? 'rgba(124, 169, 146, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${showSkeleton ? '#7CA992' : 'rgba(255, 255, 255, 0.08)'}`,
                color: showSkeleton ? '#7CA992' : '#9CAEA4',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {showSkeleton ? 'Skeleton ON' : 'Skeleton OFF'}
            </button>
          </div>
        </div>

        {/* ================= MODEL STATUS & 30-FRAME TENSOR BUFFER BAR ================= */}
        <div
          style={{
            background: '#242A27',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '16px 22px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: 'rgba(124, 169, 146, 0.16)',
                border: '1px solid rgba(124, 169, 146, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '900',
                color: '#7CA992'
              }}
            >
              LSTM
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#E4EAE6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{modelStatus}</span>
                {isTfModelLoaded && (
                  <span style={{ fontSize: '10.5px', background: 'rgba(124, 169, 146, 0.18)', color: '#7CA992', padding: '2px 8px', borderRadius: '6px' }}>
                    model.json Loaded
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#9CAEA4' }}>
                Input: Tensor3D [1, 30, 63] • Vocabulary: {modelClasses.length} Dynamic Words
              </div>
            </div>
          </div>

          {/* 30-Frame Sequence Buffer Meter */}
          <div style={{ minWidth: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '800', color: '#9CAEA4', marginBottom: '6px' }}>
              <span>LANDMARK SEQUENCE BUFFER</span>
              <span style={{ color: bufferLength === 30 ? '#7CA992' : '#d4a373' }}>
                {bufferLength} / 30 Frames ({Math.round((bufferLength / 30) * 100)}%)
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(bufferLength / 30) * 100}%`,
                  height: '100%',
                  background: bufferLength === 30 ? '#7CA992' : '#d4a373',
                  borderRadius: '999px',
                  transition: 'width 0.1s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* ================= RECOGNITION MODE SELECTOR ================= */}
        <div
          style={{
            background: '#242A27',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '14px 22px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#9CAEA4', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Select Recognition Mode:
            </span>
            <div style={{ display: 'inline-flex', background: 'rgba(25, 28, 26, 0.8)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button
                onClick={() => {
                  setRecognitionMode("word");
                  setLiveText("");
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: recognitionMode === 'word' ? '#7CA992' : 'transparent',
                  color: recognitionMode === 'word' ? '#191C1A' : '#9CAEA4',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.18s ease'
                }}
              >
                <span>Mode A: Word Recognition (5 Signs)</span>
              </button>

              <button
                onClick={() => {
                  setRecognitionMode("sentence");
                  resetSentenceSequence();
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: recognitionMode === 'sentence' ? '#7CA992' : 'transparent',
                  color: recognitionMode === 'sentence' ? '#191C1A' : '#9CAEA4',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.18s ease'
                }}
              >
                <span>Mode B: Sentence Recognition (ISL)</span>
              </button>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#7CA992', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7CA992', display: 'inline-block' }} />
            <span>
              {recognitionMode === 'word'
                ? 'Single sign pose validation active'
                : 'Temporal sequence pipeline active'}
            </span>
          </div>
        </div>

        {/* ================= MODE A: DYNAMIC LESSON CHALLENGE & TARGET VALIDATION BAR ================= */}
        {recognitionMode === 'word' && (
          <div
            style={{
              background: '#242A27',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '20px 24px',
              marginBottom: '24px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#7CA992' }}>
                    🎯 ACTIVE LESSON CHALLENGE: PERFORM &quot;{expectedTarget.toUpperCase()}&quot;
                  </span>
                  {isTargetValidated && (
                    <span style={{ fontSize: '11px', fontWeight: '800', background: '#7CA992', color: '#191C1A', padding: '2px 8px', borderRadius: '8px' }}>
                      ✓ POSE VERIFIED (+50 XP)
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '14.5px', color: '#E4EAE6', lineHeight: '1.5', maxWidth: '780px' }}>
                  <strong style={{ color: '#7CA992' }}>Gesture Guide:</strong> {activeTargetData.instruction}
                </div>
              </div>

              {/* Target Sign Quick Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '700' }}>Select Drill Sign:</span>
                {TARGET_SIGNS.map((s) => {
                  const isSelected = expectedTarget.toLowerCase() === s.label.toLowerCase();
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setExpectedTarget(s.label);
                        setTargetMatchCount(0);
                        setIsTargetValidated(false);
                        setValidationToast("");
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        background: isSelected ? '#7CA992' : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? '1px solid #7CA992' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#191C1A' : '#E4EAE6',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODE B: TARGET SENTENCE PRACTICE & SEQUENCING BAR ================= */}
        {recognitionMode === 'sentence' && (
          <div
            style={{
              background: '#242A27',
              border: '1px solid rgba(124, 169, 146, 0.35)',
              borderRadius: '20px',
              padding: '20px 24px',
              marginBottom: '24px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#7CA992' }}>
                    💬 TARGET SENTENCE PRACTICE
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(124, 169, 146, 0.18)', color: '#7CA992', padding: '2px 8px', borderRadius: '6px' }}>
                    DIALECT: INDIAN SIGN LANGUAGE (ISL)
                  </span>
                  {completedSentence && (
                    <span style={{ fontSize: '11px', fontWeight: '800', background: '#7CA992', color: '#191C1A', padding: '2px 8px', borderRadius: '6px' }}>
                      ✓ SENTENCE MATCHED (+100 XP)
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '20px', fontWeight: '900', color: '#E4EAE6', marginBottom: '4px' }}>
                  &ldquo;{activeSentenceData.english}&rdquo;
                </div>
                <div style={{ fontSize: '13px', color: '#9CAEA4', maxWidth: '780px', lineHeight: '1.4' }}>
                  <strong style={{ color: '#7CA992' }}>Linguistic Rule:</strong> {activeSentenceData.linguisticNotes}
                </div>
              </div>

              {/* 3 Target Sentences Quick Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '700' }}>Select Sentence Target:</span>
                {TARGET_SENTENCES.map((s, idx) => {
                  const isSelected = selectedSentenceId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSentenceId(s.id);
                        resetSentenceSequence();
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        background: isSelected ? '#7CA992' : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? '1px solid #7CA992' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#191C1A' : '#E4EAE6',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>#{idx + 1}</span>
                      <span>&ldquo;{s.english}&rdquo;</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sequence Progression Breadcrumb Track */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '12px', color: '#9CAEA4', fontWeight: '800', textTransform: 'uppercase' }}>
                Progression ({detectedSequence.length}/{activeSentenceData.tokens.length}):
              </span>
              {activeSentenceData.tokens.map((tok, idx) => {
                const isMatched = detectedSequence.some((d, dIdx) => dIdx === idx);
                const isCurrent = detectedSequence.length === idx;
                return (
                  <div
                    key={tok.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: isMatched
                        ? 'rgba(124, 169, 146, 0.22)'
                        : isCurrent
                        ? 'rgba(124, 169, 146, 0.1)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isMatched
                        ? '1.5px solid #7CA992'
                        : isCurrent
                        ? '1.5px dashed #7CA992'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      padding: '7px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '800',
                      color: isMatched ? '#7CA992' : isCurrent ? '#E4EAE6' : '#9CAEA4'
                    }}
                  >
                    <span style={{ fontSize: '10.5px', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                      {tok.badge || `STEP ${idx + 1}`}
                    </span>
                    <span>{tok.label}</span>
                    {isMatched && <span style={{ color: '#7CA992' }}>[MATCHED]</span>}
                    {isCurrent && (
                      <span style={{ fontSize: '10px', background: '#7CA992', color: '#191C1A', padding: '1px 5px', borderRadius: '4px' }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                );
              })}

              <button
                onClick={resetSentenceSequence}
                style={{
                  marginLeft: 'auto',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#E4EAE6',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Reset Sequence
              </button>
            </div>
          </div>
        )}


        {/* ================= 2-COLUMN SPLIT SCREEN ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.25fr) minmax(320px, 1fr)', gap: '28px', alignItems: 'start' }}>
          
          {/* ================= LEFT SIDE: WEBCAM FEED & COMPUTER VISION ================= */}
          <div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4 / 3',
                maxHeight: '520px',
                borderRadius: '24px',
                overflow: 'hidden',
                border: isTargetValidated ? '3px solid #7CA992' : '3px solid rgba(124, 169, 146, 0.35)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
                backgroundColor: '#191C1A'
              }}
            >
              {/* Live Hand Count & Tracking Indicator Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  zIndex: 25,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
              >
                <div
                  style={{
                    background: 'rgba(25, 28, 26, 0.90)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: detectedHandsCount > 0 ? '#7CA992' : '#9CAEA4',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: detectedHandsCount > 0 ? '#7CA992' : '#9CAEA4'
                    }}
                  />
                  <span>
                    {detectedHandsCount === 0
                      ? 'DETECTED HANDS: 0'
                      : detectedHandsCount === 1
                      ? `DETECTED HANDS: 1 (${detectedHandTypes[0] || 'Hand'})`
                      : `DETECTED HANDS: 2 (${detectedHandTypes.join(' + ')})`}
                  </span>
                </div>

                {confidence > 0 && (
                  <div
                    style={{
                      background: 'rgba(25, 28, 26, 0.90)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(124, 169, 146, 0.35)',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: '800',
                      color: '#7CA992',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
                    }}
                  >
                    CONFIDENCE: {Math.round(confidence * 100)}%
                  </div>
                )}
              </div>

              {/* Webcam Component */}
              <Webcam
                ref={webcamRef}
                mirrored={userSettings.cameraMirror}
                videoConstraints={{
                  deviceId: userSettings.cameraId ? { exact: userSettings.cameraId } : undefined,
                  width: 640,
                  height: 480,
                  facingMode: "user"
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />

              {/* Canvas Overlay for hand landmarks */}
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 20,
                  pointerEvents: 'none'
                }}
              />

              {/* Loading Indicator */}
              {!isReady && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(25, 28, 26, 0.92)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '14px',
                    backdropFilter: 'blur(8px)',
                    padding: '24px',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      border: '4px solid #7CA992',
                      borderTopColor: 'transparent',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#E4EAE6' }}>
                    {status}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#9CAEA4', maxWidth: '320px' }}>
                    Initializing client-side MediaPipe landmark vision.
                  </div>
                </div>
              )}

              {/* Paywall Overlay if locked module */}
              {isModuleLocked && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(25, 28, 26, 0.95)',
                    backdropFilter: 'blur(14px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    textAlign: 'center',
                    zIndex: 20
                  }}
                >
                  <div style={{ fontSize: '42px', marginBottom: '10px' }}>🔒</div>
                  <h3 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 8px 0', color: '#E4EAE6' }}>
                    Pro Camera Module Locked
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#9CAEA4', maxWidth: '340px', margin: '0 0 20px 0' }}>
                    Modules 6 to 15 are reserved for SignVerse Pro members.
                  </p>
                  <button
                    onClick={() => setIsPaywallOpen(true)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#7CA992',
                      color: '#191C1A',
                      fontSize: '14px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    Unlock Pro Now (₹199) ➔
                  </button>
                </div>
              )}
            </div>

            {/* Quick Helper Tips */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '12px', color: '#9CAEA4' }}>
              <span>💡 Hold hand clearly inside the frame • FPS: {fps}</span>
              <span>21 3D Landmarks • 63 Features / Frame</span>
            </div>
          </div>

          {/* ================= RIGHT SIDE: DYNAMIC AI VALIDATION & TRANSLATION OUTPUT ================= */}
          <div
            style={{
              background: '#242A27',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '26px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}
          >
            {recognitionMode === 'word' ? (
              <div>
                {/* Output Panel Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', background: 'rgba(124, 169, 146, 0.16)', color: '#7CA992', padding: '3px 8px', borderRadius: '6px' }}>MODE A</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#9CAEA4' }}>
                      GESTURE RECOGNITION & VALIDATION
                    </span>
                  </div>
                  {confidence > 0 && (
                    <span style={{ fontSize: '12px', fontWeight: '800', background: 'rgba(124, 169, 146, 0.16)', color: '#7CA992', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(124, 169, 146, 0.3)' }}>
                      {Math.round(confidence * 100)}% Match
                    </span>
                  )}
                </div>

                {/* HUGE, HIGHLY VISIBLE LIVE OUTPUT BOX */}
                <div
                  style={{
                    background: isTargetValidated
                      ? 'rgba(124, 169, 146, 0.18)'
                      : liveText
                      ? 'rgba(124, 169, 146, 0.1)'
                      : 'rgba(25, 28, 26, 0.7)',
                    border: isTargetValidated ? '2px solid #7CA992' : liveText ? '1.5px solid #7CA992' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '24px 20px',
                    textAlign: 'center',
                    marginBottom: '20px',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', color: isTargetValidated ? '#7CA992' : liveText ? '#7CA992' : '#9CAEA4', marginBottom: '8px' }}>
                    {isTargetValidated
                      ? `[TARGET "${expectedTarget}" VALIDATED]`
                      : liveText
                      ? `DETECTED WORD: ${liveText.toUpperCase()}`
                      : `AWAITING HAND GESTURE...`}
                  </div>

                  <div style={{ minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {liveText ? (
                      <span
                        style={{
                          fontSize: 'clamp(44px, 5.5vw, 64px)',
                          fontWeight: '900',
                          letterSpacing: '-1px',
                          color: '#E4EAE6'
                        }}
                      >
                        &ldquo;{liveText}&rdquo;
                      </span>
                    ) : (
                      <span style={{ fontSize: '14.5px', color: '#9CAEA4', fontStyle: 'italic', maxWidth: '320px' }}>
                        Perform hand gestures in camera view. MediaPipe Hands detects 21 landmarks.
                      </span>
                    )}
                  </div>

                  {activeGesture && activeGesture !== "Awaiting Hand Sign..." && (
                    <div style={{ marginTop: '6px', fontSize: '13px', color: '#9CAEA4', fontWeight: '600' }}>
                      Gesture: <strong style={{ color: '#7CA992' }}>{activeGesture}</strong>
                    </div>
                  )}

                  {dlPrediction.word && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#7CA992', fontWeight: '700' }}>
                      LSTM Confidence: {Math.round(dlPrediction.confidence * 100)}% • Model Output: {dlPrediction.word}
                    </div>
                  )}
                </div>

                {/* Validation Status Indicator */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '700', textTransform: 'uppercase' }}>Lesson Verification Status</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: isTargetValidated ? '#7CA992' : '#d4a373' }}>
                      {isTargetValidated ? `Passed (100% Locked)` : `Hold Stability: ${Math.min(100, targetMatchCount * 34)}%`}
                    </div>
                  </div>

                  {isTargetValidated && (
                    <button
                      onClick={() => {
                        const currentIndex = TARGET_SIGNS.findIndex((s) => s.label.toLowerCase() === expectedTarget.toLowerCase());
                        const nextIndex = (currentIndex + 1) % TARGET_SIGNS.length;
                        setExpectedTarget(TARGET_SIGNS[nextIndex].label);
                        setTargetMatchCount(0);
                        setIsTargetValidated(false);
                        setValidationToast("");
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: '#7CA992',
                        border: 'none',
                        color: '#191C1A',
                        fontSize: '12.5px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      Next Drill Sign &rarr;
                    </button>
                  )}
                </div>

                {/* 5 TARGET STATIC SIGNS GRID */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9CAEA4', marginBottom: '12px' }}>
                    ACTIVE TARGET VOCABULARY (5 PRESERVED WORDS)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    {TARGET_SIGNS.map((s) => {
                      const isActive = activeSignId === s.id;
                      const isTarget = expectedTarget.toLowerCase() === s.label.toLowerCase();
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setExpectedTarget(s.label);
                            setTargetMatchCount(0);
                            setIsTargetValidated(false);
                            setValidationToast("");
                          }}
                          style={{
                            background: isTarget
                              ? 'rgba(124, 169, 146, 0.22)'
                              : isActive
                              ? 'rgba(124, 169, 146, 0.12)'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isTarget ? '1.5px solid #7CA992' : '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '14px',
                            padding: '12px 10px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontSize: '11px', fontWeight: '900', color: '#7CA992', background: 'rgba(124, 169, 146, 0.15)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '6px' }}>
                            {s.tag || 'SIGN'}
                          </div>
                          <div style={{ fontWeight: '800', fontSize: '14px', color: isTarget ? '#7CA992' : '#E4EAE6' }}>
                            {s.label}
                          </div>
                          <div style={{ fontSize: '10px', color: isTarget ? '#E4EAE6' : '#9CAEA4', marginTop: '2px' }}>
                            {isTarget ? '[Active Target]' : s.gesture}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Sentence Recognition Output Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', background: 'rgba(124, 169, 146, 0.16)', color: '#7CA992', padding: '3px 8px', borderRadius: '6px' }}>MODE B</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#9CAEA4' }}>
                      TEMPORAL SENTENCE TRANSLATOR
                    </span>
                  </div>
                  {confidence > 0 && (
                    <span style={{ fontSize: '12px', fontWeight: '800', background: 'rgba(124, 169, 146, 0.16)', color: '#7CA992', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(124, 169, 146, 0.3)' }}>
                      {Math.round(confidence * 100)}% Match
                    </span>
                  )}
                </div>

                {/* SENTENCE OUTPUT DISPLAY BOX */}
                <div
                  style={{
                    background: completedSentence
                      ? 'rgba(124, 169, 146, 0.18)'
                      : detectedSequence.length > 0
                      ? 'rgba(124, 169, 146, 0.08)'
                      : 'rgba(25, 28, 26, 0.7)',
                    border: completedSentence
                      ? '2.5px solid #7CA992'
                      : detectedSequence.length > 0
                      ? '1.5px solid rgba(124, 169, 146, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '24px 20px',
                    textAlign: 'center',
                    marginBottom: '20px',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', color: completedSentence ? '#7CA992' : '#9CAEA4', marginBottom: '8px' }}>
                    {completedSentence
                      ? `[FULL SENTENCE RECOGNIZED - ${completedSentence.time}]`
                      : `ISL SEQUENCE: STEP ${detectedSequence.length + 1} OF ${activeSentenceData.tokens.length}`}
                  </div>

                  <div style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {completedSentence ? (
                      <>
                        <span
                          style={{
                            fontSize: 'clamp(26px, 3.5vw, 36px)',
                            fontWeight: '900',
                            letterSpacing: '-0.5px',
                            color: '#E4EAE6',
                            lineHeight: '1.2'
                          }}
                        >
                          &ldquo;{completedSentence.english}&rdquo;
                        </span>
                        <div style={{ fontSize: '13px', color: '#7CA992', fontWeight: '800' }}>
                          ISL Sequence: [{completedSentence.tokens.map((t) => t.label).join('] -> [')}]
                        </div>
                      </>
                    ) : detectedSequence.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <div style={{ fontSize: '13px', color: '#9CAEA4' }}>Detected Signs In Order:</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                          {detectedSequence.map((d, i) => (
                            <span
                              key={i}
                              style={{
                                padding: '4px 10px',
                                background: '#7CA992',
                                color: '#191C1A',
                                borderRadius: '8px',
                                fontWeight: '800',
                                fontSize: '13px'
                              }}
                            >
                              {d.label}
                            </span>
                          ))}
                          <span style={{ color: '#9CAEA4' }}>&rarr;</span>
                          <span style={{ color: '#E4EAE6', fontSize: '13px', fontWeight: '700', fontStyle: 'italic' }}>
                            Next: {activeSentenceData.tokens[detectedSequence.length]?.label}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '14.5px', color: '#9CAEA4', fontStyle: 'italic', maxWidth: '340px' }}>
                        Perform sign gestures sequentially in front of camera. System tracks single or two hands automatically.
                      </span>
                    )}
                  </div>

                  {/* Actions Bar for Completed Sentence */}
                  {completedSentence && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => speakSentence(completedSentence.english)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          background: '#7CA992',
                          border: 'none',
                          color: '#191C1A',
                          fontWeight: '800',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>Speak Sentence</span>
                      </button>

                      <button
                        onClick={resetSentenceSequence}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#E4EAE6',
                          fontWeight: '800',
                          fontSize: '12.5px',
                          cursor: 'pointer'
                        }}
                      >
                        Practice Again
                      </button>
                    </div>
                  )}

                  {/* Live Active Gesture Status */}
                  {activeCandidateToken && (
                    <div style={{ marginTop: '12px', fontSize: '12.5px', color: '#9CAEA4' }}>
                      Current Live Sign: <strong style={{ color: '#7CA992' }}>{activeCandidateToken.label}</strong> ({Math.round(confidence * 100)}% match)
                    </div>
                  )}
                </div>

                {/* Pipeline Guidance & Transition Helper */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '700', textTransform: 'uppercase' }}>
                      Sequence Status & Transition Detection
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: completedSentence ? '#7CA992' : '#E4EAE6', marginTop: '2px' }}>
                      {sentenceStatus}
                    </div>
                  </div>

                  <button
                    onClick={resetSentenceSequence}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#9CAEA4',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Reset
                  </button>
                </div>

                {/* SENTENCE COMPONENT SIGNS BREAKDOWN */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9CAEA4', marginBottom: '12px' }}>
                    REQUIRED COMPONENT SIGNS IN SEQUENCE
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    {activeSentenceData.tokens.map((tok, idx) => {
                      const isMatched = detectedSequence.some((d, dIdx) => dIdx === idx);
                      const isCurrent = detectedSequence.length === idx;
                      return (
                        <div
                          key={tok.id}
                          style={{
                            background: isMatched
                              ? 'rgba(124, 169, 146, 0.22)'
                              : isCurrent
                              ? 'rgba(124, 169, 146, 0.12)'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isMatched ? '1.5px solid #7CA992' : isCurrent ? '1.5px dashed #7CA992' : '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '14px',
                            padding: '12px 10px',
                            textAlign: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontSize: '11px', fontWeight: '900', color: '#7CA992', background: 'rgba(124, 169, 146, 0.15)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginBottom: '6px' }}>
                            {tok.badge || `STEP ${idx + 1}`}
                          </div>
                          <div style={{ fontWeight: '800', fontSize: '13.5px', color: isMatched ? '#7CA992' : '#E4EAE6' }}>
                            {tok.label}
                          </div>
                          <div style={{ fontSize: '10.5px', color: isMatched ? '#7CA992' : '#9CAEA4', marginTop: '4px', lineHeight: '1.3' }}>
                            {isMatched ? '[MATCHED]' : isCurrent ? '[ACTIVE STEP]' : '[WAITING]'}
                          </div>
                          <div style={{ fontSize: '10px', color: '#9CAEA4', marginTop: '4px', fontStyle: 'italic' }}>
                            {tok.instruction}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}


            {/* Translation History Box */}
            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#9CAEA4', textTransform: 'uppercase' }}>
                  Recognition Log
                </span>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    style={{ background: 'none', border: 'none', color: '#7CA992', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}
                  >
                    Clear History
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '72px', overflowY: 'auto' }}>
                {history.length === 0 ? (
                  <span style={{ fontSize: '12px', color: '#9CAEA4', fontStyle: 'italic' }}>
                    No gestures logged yet.
                  </span>
                ) : (
                  history.slice(0, 8).map((h, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(124, 169, 146, 0.14)',
                        border: '1px solid rgba(124, 169, 146, 0.25)',
                        fontSize: '12px',
                        color: '#7CA992',
                        fontWeight: '700'
                      }}
                    >
                      {h.text} ({h.time})
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Success Toast */}
      {validationToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#242A27',
            border: '1px solid #7CA992',
            color: '#E4EAE6',
            padding: '14px 22px',
            borderRadius: '14px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '800',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <span>🎉</span>
          <span>{validationToast}</span>
        </div>
      )}

      {/* Paywall Modal */}
      <UnlockProModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onUnlocked={() => {
          setIsPro(true);
        }}
        targetModuleName={currentModule?.title || 'Camera Masterclass'}
      />
    </div>
  );
}
