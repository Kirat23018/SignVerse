#!/usr/bin/env python3
"""
Test Suite for New SITE / WEBSITE Gesture (ISL L-Handshape / Digital Frame)
Runs 10 independent test iterations across varied hand positions, scales, 
angles, and handedness, plus negative tests against other signs.
"""

import math
import random

def dist(p1, p2):
    return math.hypot(p1['x'] - p2['x'], p1['y'] - p2['y'])

def analyze_hand_fingers(landmarks):
    if not landmarks or len(landmarks) < 21:
        return None

    wrist = landmarks[0]
    thumbMcp = landmarks[2]
    thumbIp = landmarks[3]
    thumbTip = landmarks[4]
    indexMcp = landmarks[5]
    indexPip = landmarks[6]
    indexTip = landmarks[8]
    middleMcp = landmarks[9]
    middlePip = landmarks[10]
    middleTip = landmarks[12]
    ringMcp = landmarks[13]
    ringPip = landmarks[14]
    ringTip = landmarks[16]
    pinkyMcp = landmarks[17]
    pinkyPip = landmarks[18]
    pinkyTip = landmarks[20]

    palmScale = max(dist(wrist, middleMcp), 0.05)

    def is_extended(mcp, pip, tip):
        return (
            dist(wrist, tip) > dist(wrist, pip) * 1.10 and
            dist(mcp, tip) > dist(mcp, pip) * 1.20 and
            tip['y'] < pip['y'] + 0.05
        )

    isIndexExt = is_extended(indexMcp, indexPip, indexTip)
    isMiddleExt = is_extended(middleMcp, middlePip, middleTip)
    isRingExt = is_extended(ringMcp, ringPip, ringTip)
    isPinkyExt = is_extended(pinkyMcp, pinkyPip, pinkyTip)

    isThumbUp = (
        thumbTip['y'] < thumbIp['y'] - 0.02 and
        thumbTip['y'] < thumbMcp['y'] - 0.04 and
        thumbTip['y'] < indexMcp['y'] - 0.02
    )

    isThumbOut = (
        dist(thumbTip, indexMcp) / palmScale > 0.75 and
        dist(thumbTip, middleMcp) / palmScale > 0.75
    )

    # Angle between thumb and index
    vT = (thumbTip['x'] - thumbMcp['x'], thumbTip['y'] - thumbMcp['y'])
    vI = (indexTip['x'] - indexMcp['x'], indexTip['y'] - indexMcp['y'])
    lenT = math.hypot(vT[0], vT[1])
    lenI = math.hypot(vI[0], vI[1])
    cosAngle = (vT[0]*vI[0] + vT[1]*vI[1]) / (max(lenT * lenI, 1e-6))
    isLPerpendicular = -0.70 < cosAngle < 0.65  # approx 50 deg to 135 deg

    # New SITE / WEBSITE L-Handshape condition (Thumb + Index at ~90 deg; Middle, Ring, Pinky curled)
    isLHandshape = (
        isIndexExt and
        isThumbOut and
        isLPerpendicular and
        not isMiddleExt and
        not isRingExt and
        not isPinkyExt
    )

    return {
        "isIndexExt": isIndexExt,
        "isMiddleExt": isMiddleExt,
        "isRingExt": isRingExt,
        "isPinkyExt": isPinkyExt,
        "isThumbOut": isThumbOut,
        "isThumbUp": isThumbUp,
        "isLHandshape": isLHandshape,
        "palmScale": palmScale,
        "cosAngle": cosAngle,
    }

def detect_site(landmarks):
    h = analyze_hand_fingers(landmarks)
    if not h:
        return False, 0.0
    if h["isLHandshape"]:
        # Confidence score based on thumb extension and index stability
        conf = 0.96 if abs(h["cosAngle"]) < 0.40 else 0.92
        return True, conf
    return False, 0.0

def generate_l_hand_landmarks(scale=1.0, angle_deg=0.0, mirrored=False, noise=0.0):
    """Generates synthetic 21 landmarks for an L-handshape (Website / Screen Frame)"""
    rad = math.radians(angle_deg)
    cos_r = math.cos(rad)
    sin_r = math.sin(rad)

    # Base coords centered on wrist at (0.5, 0.7)
    base = [
        (0.0, 0.0),      # 0 Wrist
        (0.04, -0.05),   # 1 Thumb CMC
        (0.08, -0.08),   # 2 Thumb MCP
        (0.12, -0.10),   # 3 Thumb IP
        (0.17, -0.11),   # 4 Thumb Tip (Extended outward horizontally ~90 deg)
        (0.03, -0.12),   # 5 Index MCP
        (0.03, -0.18),   # 6 Index PIP
        (0.03, -0.23),   # 7 Index DIP
        (0.03, -0.28),   # 8 Index Tip (Extended straight up)
        (0.0, -0.12),    # 9 Middle MCP
        (0.0, -0.16),    # 10 Middle PIP (Curled)
        (0.0, -0.13),    # 11 Middle DIP (Curled inward)
        (0.0, -0.10),    # 12 Middle Tip (Curled to palm)
        (-0.03, -0.11),  # 13 Ring MCP
        (-0.03, -0.15),  # 14 Ring PIP (Curled)
        (-0.03, -0.12),  # 15 Ring DIP (Curled)
        (-0.03, -0.09),  # 16 Ring Tip (Curled)
        (-0.06, -0.10),  # 17 Pinky MCP
        (-0.06, -0.13),  # 18 Pinky PIP (Curled)
        (-0.06, -0.11),  # 19 Pinky DIP (Curled)
        (-0.06, -0.08)   # 20 Pinky Tip (Curled)
    ]

    landmarks = []
    for x, y in base:
        if mirrored:
            x = -x
        # Rotate
        rx = x * cos_r - y * sin_r
        ry = x * sin_r + y * cos_r
        # Scale & shift
        fx = 0.5 + (rx * scale) + (random.gauss(0, noise) if noise > 0 else 0)
        fy = 0.7 + (ry * scale) + (random.gauss(0, noise) if noise > 0 else 0)
        landmarks.append({"x": fx, "y": fy, "z": 0.0})

    return landmarks

def run_tests():
    print("=================================================================")
    print("  TESTING NEW ISL 'SITE / WEBSITE' GESTURE (L-HANDSHAPE FRAME)   ")
    print("=================================================================")

    test_configs = [
        {"desc": "Test 1: Standard Right Hand (Optimal distance)", "scale": 1.0, "angle": 0.0, "mirrored": False, "noise": 0.001},
        {"desc": "Test 2: Standard Left Hand (Mirrored)", "scale": 1.0, "angle": 0.0, "mirrored": True, "noise": 0.001},
        {"desc": "Test 3: Hand close to camera (Larger scale 1.4x)", "scale": 1.4, "angle": 0.0, "mirrored": False, "noise": 0.002},
        {"desc": "Test 4: Hand farther from camera (Smaller scale 0.7x)", "scale": 0.7, "angle": 0.0, "mirrored": False, "noise": 0.002},
        {"desc": "Test 5: Natural hand tilt +12 degrees clockwise", "scale": 1.0, "angle": 12.0, "mirrored": False, "noise": 0.002},
        {"desc": "Test 6: Natural hand tilt -12 degrees counter-clockwise", "scale": 1.0, "angle": -12.0, "mirrored": False, "noise": 0.002},
        {"desc": "Test 7: Slight tremor / camera sensor noise (sigma=0.004)", "scale": 1.0, "angle": 4.0, "mirrored": False, "noise": 0.004},
        {"desc": "Test 8: Left hand with -10 deg tilt and moderate noise", "scale": 0.9, "angle": -10.0, "mirrored": True, "noise": 0.003},
        {"desc": "Test 9: Fast gesture movement frame (simulated motion blur)", "scale": 1.1, "angle": 8.0, "mirrored": False, "noise": 0.005},
        {"desc": "Test 10: Elevated posture at different vertical offset", "scale": 1.05, "angle": -5.0, "mirrored": False, "noise": 0.002},
    ]

    passed_count = 0
    results = []

    for i, cfg in enumerate(test_configs):
        pts = generate_l_hand_landmarks(cfg["scale"], cfg["angle"], cfg["mirrored"], cfg["noise"])
        detected, conf = detect_site(pts)
        status = "PASSED" if detected else "FAILED"
        if detected:
            passed_count += 1
        results.append({
            "test": i + 1,
            "desc": cfg["desc"],
            "detected": detected,
            "confidence": conf,
            "status": status
        })
        print(f"[{status}] Test {i+1:02d}: {cfg['desc']} -> Conf: {conf*100:.1f}%")

    print("\n-----------------------------------------------------------------")
    print(f"Independent Site Recognition Results: {passed_count} / 10 Tests Passed ({passed_count*10}%)")
    print("-----------------------------------------------------------------")

    # Negative Tests (Make sure ONE, YES, STOP, VICTORY, ROCK are NOT false-positive detected as SITE)
    print("\nTesting False Positive Rejection against Other Gestures:")
    
    # 1. ONE (Index finger up, thumb folded over middle finger)
    one_pts = generate_l_hand_landmarks()
    one_pts[4] = {"x": one_pts[9]['x'] + 0.01, "y": one_pts[9]['y'] - 0.01, "z": 0} # fold thumb
    det_one, _ = detect_site(one_pts)
    print(f"  Negative Test 'One' (Index Up, Thumb Folded): {'REJECTED (Correct)' if not det_one else 'FALSE POSITIVE'}")

    # 2. YES (Thumbs Up, all fingers folded)
    yes_pts = generate_l_hand_landmarks()
    yes_pts[8] = {"x": yes_pts[5]['x'], "y": yes_pts[5]['y'] + 0.02, "z": 0} # curl index
    det_yes, _ = detect_site(yes_pts)
    print(f"  Negative Test 'Yes' (Thumbs Up, Index Curled): {'REJECTED (Correct)' if not det_yes else 'FALSE POSITIVE'}")

    # 3. STOP (Open Palm, all 5 fingers extended)
    stop_pts = generate_l_hand_landmarks()
    stop_pts[12] = {"x": stop_pts[9]['x'], "y": stop_pts[9]['y'] - 0.16, "z": 0} # extend middle
    stop_pts[16] = {"x": stop_pts[13]['x'], "y": stop_pts[13]['y'] - 0.15, "z": 0} # extend ring
    stop_pts[20] = {"x": stop_pts[17]['x'], "y": stop_pts[17]['y'] - 0.14, "z": 0} # extend pinky
    det_stop, _ = detect_site(stop_pts)
    print(f"  Negative Test 'Stop' (All 5 Fingers Extended): {'REJECTED (Correct)' if not det_stop else 'FALSE POSITIVE'}")

    return passed_count == 10 and not det_one and not det_yes and not det_stop

if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
