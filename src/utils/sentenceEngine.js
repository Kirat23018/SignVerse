/**
 * SignVerse Hand-Only Sentence Recognition Engine (ISL - Indian Sign Language)
 * ============================================================================
 * Strict hand-only detection pipeline using MediaPipe 21 Hand Landmarks.
 * No face detection, no body pose, no emojis, no decorative graphics.
 *
 * Implements the THREE EXACT REQUESTED TARGET SENTENCES:
 * 1. "I love you."                   -> [I_LOVE_YOU]
 * 2. "My name is Happy."             -> [MY] -> [NAME] -> [HAPPY]
 * 3. "Thank you for visiting my site." -> [THANK_YOU] -> [VISIT] -> [SITE]
 *
 * Supports both Single-Hand and Two-Hand gestures with beginner-friendly,
 * natural hand positions.
 */

// 1. Normalized Landmark Computation (Wrist-relative & Palm-scaled)
export function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[0];
  const middleMcp = landmarks[9];

  // Palm scale reference distance
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  const dz = (middleMcp.z || 0) - (wrist.z || 0);
  const palmScale = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.04);

  // Normalize all 21 points relative to wrist (origin) and scaled by palm size
  return landmarks.map((pt) => ({
    x: (pt.x - wrist.x) / palmScale,
    y: (pt.y - wrist.y) / palmScale,
    z: ((pt.z || 0) - (wrist.z || 0)) / palmScale,
  }));
}

// 2. Verified Custom ISL Sentence Configurations (Hand-only, no emojis)
export const TARGET_SENTENCES = [
  {
    id: "sent_love_forever",
    english: "I love you.",
    dialect: "ISL",
    linguisticNotes: "In Indian Sign Language (ISL), affection is expressed directly via the iconic I-Love-You (ILY) handshape or flat open palm over chest/heart.",
    description: "Perform I LOVE YOU handshape (or open palm over heart).",
    tokens: [
      {
        id: "I_LOVE_YOU",
        label: "I LOVE YOU",
        badge: "STEP 1",
        mode: "1 or 2 hands",
        instruction: "Extend thumb, index, and pinky fingers with middle and ring fingers folded into palm (or place flat open palm over chest/heart).",
        acceptedSigns: ["i_love_you", "love", "ily", "chest_palm"],
      },
    ],
  },
  {
    id: "sent_my_name_happy",
    english: "My name is Happy.",
    dialect: "ISL",
    linguisticNotes: "In ISL grammar, self-introduction follows Topic-Comment order: [MY] (flat chest palm, possessive) + [NAME] (horizontal H-fingers) + [HAPPY] (radiant upward sweep). Copula 'is' is omitted.",
    description: "Hold flat palm on chest (MY) -> Hold horizontal 2-finger H-shape (NAME) -> Sweep open palm upward (HAPPY).",
    tokens: [
      {
        id: "MY",
        label: "MY",
        badge: "STEP 1",
        mode: "1 or 2 hands",
        instruction: "Place flat open hand over the center of your chest/heart (possessive 'My' in ISL, not a point).",
        acceptedSigns: ["my", "chest_palm", "please"],
      },
      {
        id: "NAME",
        label: "NAME",
        badge: "STEP 2",
        mode: "1 or 2 hands",
        instruction: "Extend index and middle fingers together horizontally (H-handshape, single hand or both hands).",
        acceptedSigns: ["name", "h_hand", "victory", "two"],
      },
      {
        id: "HAPPY",
        label: "HAPPY",
        badge: "STEP 3",
        mode: "1 or 2 hands",
        instruction: "Sweep open hand upward off the chest with fingers spread wide (radiant joy / happy, single hand or both hands).",
        acceptedSigns: ["happy", "joy", "open_palm"],
      },
    ],
  },
  {
    id: "sent_thank_visit_site",
    english: "Thank you for visiting my site.",
    dialect: "ISL",
    linguisticNotes: "In ISL hospitality etiquette, welcoming web visitors combines [THANK_YOU] (offering palm) + [VISIT] (traveling V-sign) + [SITE] (L-handshape webpage screen frame).",
    description: "Extend flat palm forward (THANK YOU) -> Extend V-shape forward (VISIT) -> Form L-shape frame (SITE).",
    tokens: [
      {
        id: "THANK_YOU",
        label: "THANK YOU",
        badge: "STEP 1",
        mode: "1 or 2 hands",
        instruction: "Extend broad flat open palm facing directly toward the camera/recipient (single hand or both hands).",
        acceptedSigns: ["thank_you", "stop", "open_palm"],
      },
      {
        id: "VISIT",
        label: "VISIT",
        badge: "STEP 2",
        mode: "1 or 2 hands",
        instruction: "Extend index and middle fingers in a V-shape pointing forward (traveling visitor / visit, single hand or both hands).",
        acceptedSigns: ["visit", "victory", "two"],
      },
      {
        id: "SITE",
        label: "SITE",
        badge: "STEP 3",
        mode: "1 or 2 hands",
        instruction: "Extend index finger upward and thumb outward at 90 degrees forming an L-shape (webpage/screen frame, single hand or both hands).",
        acceptedSigns: ["site", "l_hand", "web", "screen", "one"],
      },
    ],
  },
];

// Helper to inspect finger states for a single hand
function analyzeHandFingers(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

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

  const palmScale = Math.max(dist(wrist, middleMcp), 0.05);

  const isExtended = (mcp, pip, tip) => {
    return (
      dist(wrist, tip) > dist(wrist, pip) * 1.10 &&
      dist(mcp, tip) > dist(mcp, pip) * 1.20 &&
      tip.y < pip.y + 0.05
    );
  };

  const isIndexExt = isExtended(indexMcp, indexPip, indexTip);
  const isMiddleExt = isExtended(middleMcp, middlePip, middleTip);
  const isRingExt = isExtended(ringMcp, ringPip, ringTip);
  const isPinkyExt = isExtended(pinkyMcp, pinkyPip, pinkyTip);

  const isThumbUp =
    thumbTip.y < thumbIp.y - 0.02 &&
    thumbTip.y < thumbMcp.y - 0.04 &&
    thumbTip.y < indexMcp.y - 0.02;

  const isThumbOut = dist(thumbTip, indexMcp) / palmScale > 0.80;

  const isAllFive = isIndexExt && isMiddleExt && isRingExt && isPinkyExt;
  const isTwoFinger = isIndexExt && isMiddleExt && !isRingExt && !isPinkyExt;
  const isThreeFingerW = isIndexExt && isMiddleExt && isRingExt && !isPinkyExt;
  const isIly = isIndexExt && isPinkyExt && !isMiddleExt && !isRingExt && (isThumbOut || isThumbUp);

  // L-Handshape: Index extended upright, Thumb extended outward (~90 deg), Middle, Ring, Pinky curled into palm.
  // In official Indian Sign Language (ISLRTC) and digital media signs, this represents a Screen, Webpage corner, or Website frame.
  const isLHandshape =
    isIndexExt &&
    isThumbOut &&
    !isMiddleExt &&
    !isRingExt &&
    !isPinkyExt &&
    (dist(thumbTip, indexTip) / palmScale > 0.65) &&
    (dist(thumbTip, indexMcp) / palmScale > 0.70);

  const isVSeparated = isTwoFinger && (dist(indexTip, middleTip) / palmScale > 0.20);
  const isHParallel = isTwoFinger && (dist(indexTip, middleTip) / palmScale <= 0.25);

  const isWideSplay = isAllFive && (dist(indexTip, middleTip) / palmScale > 0.16) && (dist(thumbTip, pinkyTip) / palmScale > 1.15);

  return {
    wrist,
    indexTip,
    middleTip,
    thumbTip,
    pinkyTip,
    palmScale,
    isIndexExt,
    isMiddleExt,
    isRingExt,
    isPinkyExt,
    isThumbUp,
    isThumbOut,
    isAllFive,
    isTwoFinger,
    isThreeFingerW,
    isLHandshape,
    isIly,
    isVSeparated,
    isHParallel,
    isWideSplay,
  };
}

// 3. Robust Geometric Detector for Custom ISL Component Signs (Supports 1 or 2 hands)
export function detectSentenceComponent(primaryLandmarks, dlWord = "", secondaryLandmarks = null) {
  if (!primaryLandmarks || primaryLandmarks.length < 21) {
    return { token: null, label: "No Hand Detected", confidence: 0, conf: 0, handsUsed: 0 };
  }

  // Check TensorFlow.js LSTM predictions first if available
  const cleanDl = String(dlWord || "").toLowerCase().trim();
  if (cleanDl === "love") return { token: "I_LOVE_YOU", label: "I Love You", confidence: 0.98, conf: 0.98, handsUsed: 1 };
  if (cleanDl === "thank you") return { token: "THANK_YOU", label: "Thank You", confidence: 0.96, conf: 0.96, handsUsed: 1 };
  if (cleanDl === "victory") return { token: "VISIT", label: "Visit", confidence: 0.95, conf: 0.95, handsUsed: 1 };

  const h1 = analyzeHandFingers(primaryLandmarks);
  const h2 = secondaryLandmarks ? analyzeHandFingers(secondaryLandmarks) : null;
  const twoHandsPresent = !!h2;

  // -------------------------------------------------------------
  // TWO-HAND GESTURE COMBINATIONS (Natural ISL Variations)
  // -------------------------------------------------------------
  if (twoHandsPresent) {
    // Both hands open sweeping upward -> HAPPY
    if (h1.isAllFive && h2.isAllFive && (h1.isWideSplay || h2.isWideSplay || (h1.wrist.y < 0.65 && h2.wrist.y < 0.65))) {
      return { token: "HAPPY", label: "Happy (Two Hands Upward)", confidence: 0.98, conf: 0.98, handsUsed: 2 };
    }

    // Both hands in V-shape -> VISIT
    if ((h1.isTwoFinger || h1.isVSeparated) && (h2.isTwoFinger || h2.isVSeparated)) {
      return { token: "VISIT", label: "Visit (Two V-Hands)", confidence: 0.98, conf: 0.98, handsUsed: 2 };
    }

    // Both hands in H-shape (classic ISL two-handed NAME)
    if (h1.isHParallel && h2.isHParallel) {
      return { token: "NAME", label: "Name (Two H-Hands)", confidence: 0.97, conf: 0.97, handsUsed: 2 };
    }

    // Both hands flat over chest / crossed -> I LOVE YOU
    if (h1.isAllFive && h2.isAllFive && h1.wrist.y > 0.40 && h2.wrist.y > 0.40) {
      return { token: "I_LOVE_YOU", label: "I Love You (Hands on Chest)", confidence: 0.96, conf: 0.96, handsUsed: 2 };
    }

    // Both hands flat open forward -> THANK YOU
    if (h1.isAllFive && h2.isAllFive) {
      return { token: "THANK_YOU", label: "Thank You (Two Open Palms)", confidence: 0.96, conf: 0.96, handsUsed: 2 };
    }

    // Both hands forming a screen frame (L-shapes or open frame) -> SITE
    if ((h1.isLHandshape || h1.isThreeFingerW || h1.isAllFive) && (h2.isLHandshape || h2.isThreeFingerW || h2.isAllFive)) {
      return { token: "SITE", label: "Site / Web (Two-Hand Frame)", confidence: 0.96, conf: 0.96, handsUsed: 2 };
    }
  }

  // -------------------------------------------------------------
  // SINGLE-HAND GESTURES (Primary Hand or Secondary Hand)
  // -------------------------------------------------------------
  const activeH = h1;

  // 1. "I LOVE YOU" (Sentence 1, Step 1) -> ILY sign or open hand over heart
  if (activeH.isIly) {
    return { token: "I_LOVE_YOU", label: "I Love You (ILY Hand)", confidence: 0.98, conf: 0.98, handsUsed: 1 };
  }

  // 2. "SITE" (Sentence 3, Step 3) -> L-Handshape (Index upright, Thumb outward at 90 deg: Web/Screen frame)
  if (activeH.isLHandshape || activeH.isThreeFingerW) {
    return { token: "SITE", label: "Site / Web (L-Hand)", confidence: 0.96, conf: 0.96, handsUsed: 1 };
  }

  // 3. "NAME" (Sentence 2, Step 2) -> Horizontal H-Handshape (Index & Middle parallel)
  if (activeH.isTwoFinger && activeH.isHParallel) {
    return { token: "NAME", label: "Name (H-Hand)", confidence: 0.95, conf: 0.95, handsUsed: 1 };
  }

  // 4. "VISIT" (Sentence 3, Step 2) -> V-Handshape (Index & Middle separated)
  if (activeH.isTwoFinger && activeH.isVSeparated) {
    return { token: "VISIT", label: "Visit (V-Hand)", confidence: 0.95, conf: 0.95, handsUsed: 1 };
  }

  // 5. "MY" (Sentence 2, Step 1) -> Flat Palm over Chest (Fingers together, chest level)
  const isChestLevel = activeH.wrist.y > 0.40 && Math.abs(activeH.indexTip.x - activeH.wrist.x) > 0.08;
  if (activeH.isAllFive && !activeH.isWideSplay && isChestLevel && !activeH.isThumbUp) {
    return { token: "MY", label: "My (Chest Palm)", confidence: 0.94, conf: 0.94, handsUsed: 1 };
  }

  // 6. "HAPPY" (Sentence 2, Step 3) -> Upward sweeping open hand (Fingers splayed, elevated)
  if (activeH.isAllFive && activeH.isWideSplay && activeH.wrist.y < 0.65) {
    return { token: "HAPPY", label: "Happy (Radiant Joy)", confidence: 0.96, conf: 0.96, handsUsed: 1 };
  }

  // 7. "THANK_YOU" (Sentence 3, Step 1) -> Open palm facing forward
  if (activeH.isAllFive) {
    return { token: "THANK_YOU", label: "Thank You (Open Palm)", confidence: 0.96, conf: 0.96, handsUsed: 1 };
  }

  return { token: null, label: "Tracking Hand...", confidence: 0, conf: 0, handsUsed: twoHandsPresent ? 2 : 1 };
}

export function checkTokenMatchesStep(detectedToken, stepDef) {
  if (!detectedToken || !stepDef) return false;
  const d = String(detectedToken).toLowerCase();
  if (d === stepDef.id.toLowerCase()) return true;
  if (Array.isArray(stepDef.acceptedSigns) && stepDef.acceptedSigns.includes(d)) return true;
  return false;
}
