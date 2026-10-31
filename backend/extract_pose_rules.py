"""
Sign Language Pose Extractor & Real-Time Rule Generator
======================================================
1. Opens an MP4 video (e.g. cow_2.mp4), extracts the hand & pose landmarks at a keyframe.
2. Automatically generates clean Python if/else detection logic using scale-invariant
   geometric rules (distances, finger extension states, relative face/head positions).

Usage:
    # Interactive scrubber GUI (select keyframe with trackbar + press Space/Enter):
    python extract_pose_rules.py --video path/to/cow_2.mp4 --gesture-name Cow

    # Specific frame index:
    python extract_pose_rules.py --video path/to/cow_2.mp4 --frame 24 --gesture-name Cow

    # Automatic apex detection (no GUI):
    python extract_pose_rules.py --video path/to/cow_2.mp4 --auto --gesture-name Cow
"""

import os
import sys
import math
import json
import argparse
from typing import Dict, Any, List, Optional, Tuple

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None
    np = None

# Landmark Indices for MediaPipe Hands
WRIST = 0
THUMB_CMC = 1; THUMB_MCP = 2; THUMB_IP = 3; THUMB_TIP = 4
INDEX_MCP = 5; INDEX_PIP = 6; INDEX_DIP = 7; INDEX_TIP = 8
MIDDLE_MCP = 9; MIDDLE_PIP = 10; MIDDLE_DIP = 11; MIDDLE_TIP = 12
RING_MCP = 13; RING_PIP = 14; RING_DIP = 15; RING_TIP = 16
PINKY_MCP = 17; PINKY_PIP = 18; PINKY_DIP = 19; PINKY_TIP = 20

# Landmark Indices for MediaPipe Pose
NOSE = 0
LEFT_EYE = 2; RIGHT_EYE = 5
LEFT_EAR = 7; RIGHT_EAR = 8
MOUTH_LEFT = 9; MOUTH_RIGHT = 10
LEFT_SHOULDER = 11; RIGHT_SHOULDER = 12


def dist2d(p1, p2) -> float:
    """Calculate Euclidean distance between two points with .x and .y attributes."""
    return math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)


class SimplePoint:
    def __init__(self, x: float, y: float, z: float = 0.0):
        self.x = x
        self.y = y
        self.z = z


class SignPoseAnalyzer:
    def __init__(self, gesture_name: str = "TargetGesture"):
        self.gesture_name = gesture_name

    def analyze_hand_geometry(self, hand_lms: List[Any], handedness: str = "Right") -> Dict[str, Any]:
        """
        Analyzes a single hand's 21 landmarks.
        Returns scale-invariant geometric features:
        - Palm scale (reference base length)
        - Finger extension booleans
        - Pairwise fingertip distances
        - Normalization ratios
        """
        wrist = hand_lms[WRIST]
        middle_mcp = hand_lms[MIDDLE_MCP]
        index_mcp = hand_lms[INDEX_MCP]
        pinky_mcp = hand_lms[PINKY_MCP]

        # 1. Palm Scale: Reference metric to make all rules distance-invariant
        palm_scale = dist2d(wrist, middle_mcp)
        if palm_scale < 1e-4:
            palm_scale = 0.1  # Fallback

        # 2. Regular finger extensions (dist from wrist to tip vs pip)
        def is_ext(mcp_idx, pip_idx, tip_idx):
            tip = hand_lms[tip_idx]
            pip = hand_lms[pip_idx]
            mcp = hand_lms[mcp_idx]
            return (dist2d(wrist, tip) > dist2d(wrist, pip) * 1.15) and (dist2d(mcp, tip) > dist2d(mcp, pip) * 1.30)

        index_ext = is_ext(INDEX_MCP, INDEX_PIP, INDEX_TIP)
        middle_ext = is_ext(MIDDLE_MCP, MIDDLE_PIP, MIDDLE_DIP)
        ring_ext = is_ext(RING_MCP, RING_PIP, RING_TIP)
        pinky_ext = is_ext(PINKY_MCP, PINKY_PIP, PINKY_TIP)

        # Thumb extension: tip distance from pinky MCP and index MCP
        thumb_tip = hand_lms[THUMB_TIP]
        thumb_mcp = hand_lms[THUMB_MCP]
        thumb_dist_pinky = dist2d(thumb_tip, pinky_mcp) / palm_scale
        thumb_dist_index = dist2d(thumb_tip, index_mcp) / palm_scale
        thumb_ext = (thumb_dist_pinky > 1.25) or (thumb_dist_index > 0.85)

        # Normalized tip-to-tip distances
        index_tip = hand_lms[INDEX_TIP]
        middle_tip = hand_lms[MIDDLE_TIP]
        pinky_tip = hand_lms[PINKY_TIP]

        d_thumb_index = dist2d(thumb_tip, index_tip) / palm_scale
        d_thumb_pinky = dist2d(thumb_tip, pinky_tip) / palm_scale
        d_index_middle = dist2d(index_tip, middle_tip) / palm_scale
        d_middle_ring = dist2d(middle_tip, hand_lms[RING_TIP]) / palm_scale

        return {
            "handedness": handedness,
            "palm_scale": round(palm_scale, 4),
            "finger_states": {
                "thumb_extended": thumb_ext,
                "index_extended": index_ext,
                "middle_extended": middle_ext,
                "ring_extended": ring_ext,
                "pinky_extended": pinky_ext
            },
            "normalized_distances": {
                "thumb_to_index": round(d_thumb_index, 3),
                "thumb_to_pinky": round(d_thumb_pinky, 3),
                "index_to_middle": round(d_index_middle, 3),
                "middle_to_ring": round(d_middle_ring, 3)
            },
            "wrist_coord": {"x": round(wrist.x, 3), "y": round(wrist.y, 3)},
            "thumb_tip_coord": {"x": round(thumb_tip.x, 3), "y": round(thumb_tip.y, 3)},
            "index_tip_coord": {"x": round(index_tip.x, 3), "y": round(index_tip.y, 3)},
            "pinky_tip_coord": {"x": round(pinky_tip.x, 3), "y": round(pinky_tip.y, 3)}
        }

    def analyze_face_relative_position(self, hand_lms: List[Any], pose_lms: Optional[List[Any]]) -> Dict[str, Any]:
        """
        Analyzes hand position relative to facial and body landmarks.
        Essential for signs performed near the temple/ears (like 'cow'/horns), chin, or chest.
        """
        if not pose_lms or len(pose_lms) < 13:
            return {"face_tracking": False}

        wrist = hand_lms[WRIST]
        thumb_tip = hand_lms[THUMB_TIP]
        nose = pose_lms[NOSE]
        left_ear = pose_lms[LEFT_EAR]
        right_ear = pose_lms[RIGHT_EAR]
        left_shoulder = pose_lms[LEFT_SHOULDER]
        right_shoulder = pose_lms[RIGHT_SHOULDER]

        # Face scale: distance between ears or eyes
        face_scale = dist2d(left_ear, right_ear)
        if face_scale < 1e-4:
            face_scale = 0.2

        # Distances to ears (crucial for signs like Cow/horns near temple/ears)
        d_wrist_left_ear = dist2d(wrist, left_ear) / face_scale
        d_wrist_right_ear = dist2d(wrist, right_ear) / face_scale
        d_thumb_left_ear = dist2d(thumb_tip, left_ear) / face_scale
        d_thumb_right_ear = dist2d(thumb_tip, right_ear) / face_scale

        # Closest ear distance
        min_ear_dist = min(d_wrist_left_ear, d_wrist_right_ear)
        min_thumb_ear_dist = min(d_thumb_left_ear, d_thumb_right_ear)

        # Height relative to nose (y coordinate: lower y means higher on screen)
        # If hand is above nose: y_wrist < y_nose
        hand_above_nose = wrist.y < (nose.y + 0.05)
        hand_above_shoulder = wrist.y < min(left_shoulder.y, right_shoulder.y)

        # Relative vertical displacement normalized
        delta_y_nose = (wrist.y - nose.y) / face_scale

        return {
            "face_tracking": True,
            "face_scale": round(face_scale, 4),
            "min_ear_distance": round(min_ear_dist, 3),
            "min_thumb_to_ear_distance": round(min_thumb_ear_dist, 3),
            "hand_above_nose": hand_above_nose,
            "hand_above_shoulder": hand_above_shoulder,
            "delta_y_to_nose": round(delta_y_nose, 3)
        }

    def generate_python_code(self, hand_features: Dict[str, Any], face_features: Dict[str, Any]) -> str:
        """
        Synthesizes executable, production-ready Python if/else detection logic
        with reasonable tolerance margins (e.g. ±25% on distances).
        """
        name_clean = "".join(c if c.isalnum() else "_" for c in self.gesture_name).lower()
        func_name = f"is_{name_clean}_pose"

        fingers = hand_features["finger_states"]
        dists = hand_features["normalized_distances"]
        
        # Build conditions dynamically
        checks = []

        # 1. Finger Extension Rules
        checks.append("# 1. Finger Extension States (Extended vs Folded)")
        for f_name, is_extended in fingers.items():
            checks.append(f"    # {f_name}: {'Must be extended' if is_extended else 'Must be curled/folded'}")
            if is_extended:
                checks.append(f"    if not finger_states['{f_name}']:\n        return False")
            else:
                checks.append(f"    if finger_states['{f_name}']:\n        return False")

        # 2. Key Geometric Distances with Tolerance Margins (±30%)
        checks.append("\n    # 2. Normalized Landmark Distance Thresholds")
        checks.append("    # (Scale-invariant: normalized by distance between wrist and middle MCP)")
        
        # Check thumb to index
        t_i = dists["thumb_to_index"]
        t_i_min = max(0.05, round(t_i * 0.70, 2))
        t_i_max = round(t_i * 1.35, 2)
        checks.append(f"    # Thumb tip to Index tip distance (reference: {t_i})")
        checks.append(f"    if not ({t_i_min} <= d_thumb_index <= {t_i_max}):\n        return False")

        # Check thumb to pinky (Crucial for signs like Cow 'horns' where thumb & pinky stick out!)
        t_p = dists["thumb_to_pinky"]
        if fingers.get("thumb_extended") and fingers.get("pinky_extended"):
            t_p_min = max(0.5, round(t_p * 0.70, 2))
            checks.append(f"    # Thumb tip to Pinky tip separation (Horns span: {t_p})")
            checks.append(f"    if d_thumb_pinky < {t_p_min}:\n        return False")

        # 3. Face / Body Relative Checks (if gesture is performed near head/ears/chest)
        if face_features.get("face_tracking"):
            checks.append("\n    # 3. Position Relative to Face / Head (Head / Temple Signs)")
            min_ear = face_features["min_ear_distance"]
            min_thumb_ear = face_features["min_thumb_to_ear_distance"]
            
            # If hand is close to the ear/temple (common for animal signs like 'cow' horns)
            if min_ear < 2.2 or min_thumb_ear < 2.0:
                ear_thresh = round(min(min_ear, min_thumb_ear) * 1.45, 2)
                checks.append(f"    # Hand must be located near temple / ear region")
                checks.append("    if pose_landmarks is not None:")
                checks.append(f"        if min_ear_dist > {ear_thresh}:\n            return False")

            if face_features.get("hand_above_shoulder"):
                checks.append("    # Hand must be raised above shoulder level")
                checks.append("    if pose_landmarks is not None and not hand_above_shoulder:\n        return False")

        rules_body = "\n".join(checks)

        code_template = f'''# ==============================================================================
# Automatically Generated Real-Time Detector for Sign: "{self.gesture_name}"
# Generated via Geometric Landmark Extractor
# ==============================================================================

import math

def {func_name}(hand_landmarks, pose_landmarks=None) -> bool:
    """
    Detects the '{self.gesture_name}' sign pose using pure landmark geometry.
    Returns True if current frame matches the pose signature, False otherwise.
    
    Parameters:
        hand_landmarks: List of 21 MediaPipe hand landmark points (.x, .y, .z)
        pose_landmarks: (Optional) List of 33 MediaPipe pose landmark points
    """
    if not hand_landmarks or len(hand_landmarks) < 21:
        return False

    def dist(p1, p2):
        return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)

    # Key Hand Landmarks
    wrist = hand_landmarks[0]
    thumb_mcp = hand_landmarks[2]
    thumb_tip = hand_landmarks[4]
    index_mcp = hand_landmarks[5]
    index_pip = hand_landmarks[6]
    index_tip = hand_landmarks[8]
    middle_mcp = hand_landmarks[9]
    middle_pip = hand_landmarks[10]
    middle_tip = hand_landmarks[12]
    ring_mcp = hand_landmarks[13]
    ring_pip = hand_landmarks[14]
    ring_tip = hand_landmarks[16]
    pinky_mcp = hand_landmarks[17]
    pinky_pip = hand_landmarks[18]
    pinky_tip = hand_landmarks[20]

    # Palm Scale Normalization Factor (Distance from wrist to middle MCP)
    palm_scale = dist(wrist, middle_mcp)
    if palm_scale < 1e-4:
        palm_scale = 0.1

    # Evaluate Finger Extension States
    def is_extended(mcp, pip, tip):
        return (dist(wrist, tip) > dist(wrist, pip) * 1.15) and (dist(mcp, tip) > dist(mcp, pip) * 1.30)

    finger_states = {{
        'thumb_extended': (dist(thumb_tip, pinky_mcp) / palm_scale > 1.25) or (dist(thumb_tip, index_mcp) / palm_scale > 0.85),
        'index_extended': is_extended(index_mcp, index_pip, index_tip),
        'middle_extended': is_extended(middle_mcp, middle_pip, middle_tip),
        'ring_extended': is_extended(ring_mcp, ring_pip, ring_tip),
        'pinky_extended': is_extended(pinky_mcp, pinky_pip, pinky_tip),
    }}

    # Normalized Landmark Distances
    d_thumb_index = dist(thumb_tip, index_tip) / palm_scale
    d_thumb_pinky = dist(thumb_tip, pinky_tip) / palm_scale
    d_index_middle = dist(index_tip, middle_tip) / palm_scale

    # Pose/Face Relative Computations (if pose is available)
    min_ear_dist = 999.0
    hand_above_shoulder = True
    if pose_landmarks and len(pose_landmarks) > 12:
        left_ear = pose_landmarks[7]
        right_ear = pose_landmarks[8]
        left_shoulder = pose_landmarks[11]
        right_shoulder = pose_landmarks[12]
        face_scale = max(dist(left_ear, right_ear), 0.1)

        d_w_lear = dist(wrist, left_ear) / face_scale
        d_w_rear = dist(wrist, right_ear) / face_scale
        d_t_lear = dist(thumb_tip, left_ear) / face_scale
        d_t_rear = dist(thumb_tip, right_ear) / face_scale
        min_ear_dist = min(d_w_lear, d_w_rear, d_t_lear, d_t_rear)
        hand_above_shoulder = wrist.y < min(left_shoulder.y, right_shoulder.y)

{rules_body}

    # All geometric constraints passed!
    return True
'''
        return code_template


def run_extraction(
    video_path: str,
    target_frame: Optional[int] = None,
    gesture_name: str = "SignGesture",
    interactive: bool = True,
    output_py: Optional[str] = None
) -> Tuple[Dict[str, Any], str]:
    """
    Main extraction routine:
    1. Loads video via OpenCV
    2. Lets user scrub/select keyframe or uses target_frame
    3. Analyzes landmarks with MediaPipe Hands & Pose
    4. Generates Python rule detector
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found at: {video_path}")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise IOError(f"Could not open video file: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    print(f"[INFO] Opened video: {video_path} ({total_frames} frames @ {fps:.1f} FPS)")

    # Initialize MediaPipe
    try:
        import mediapipe as mp
    except ImportError:
        print("[ERROR] mediapipe is not installed! Run: pip install mediapipe opencv-python")
        sys.exit(1)

    mp_hands = mp.solutions.hands
    mp_pose = mp.solutions.pose
    mp_draw = mp.solutions.drawing_utils

    hands = mp_hands.Hands(static_image_mode=True, max_num_hands=2, min_detection_confidence=0.45)
    pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.45)

    selected_frame_idx = target_frame if target_frame is not None else int(total_frames * 0.5)

    # Interactive GUI scrubber if requested
    if interactive and sys.platform != "linux" or (interactive and "DISPLAY" in os.environ):
        window_name = f"SignVerse Scrubber: [{gesture_name}] - Use slider or SPACE to select"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_name, 960, 540)

        current_idx = [selected_frame_idx]

        def on_trackbar(val):
            current_idx[0] = min(max(val, 0), total_frames - 1)

        cv2.createTrackbar("Frame", window_name, selected_frame_idx, max(total_frames - 1, 1), on_trackbar)

        print("\n" + "=" * 60)
        print("  INTERACTIVE FRAME SELECTOR CONTROLS:")
        print("  - Drag the 'Frame' trackbar slider to view any frame")
        print("  - Press [SPACE] or [ENTER] to lock in the selected frame")
        print("  - Press [Q] or [ESC] to proceed with current frame")
        print("=" * 60 + "\n")

        while True:
            cap.set(cv2.CAP_PROP_POS_FRAMES, current_idx[0])
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            h, w, _ = frame.shape
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            hand_res = hands.process(rgb)
            pose_res = pose.process(rgb)

            display = frame.copy()

            # Draw skeletons
            if pose_res.pose_landmarks:
                mp_draw.draw_landmarks(display, pose_res.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            if hand_res.multi_hand_landmarks:
                for hand_lms in hand_res.multi_hand_landmarks:
                    mp_draw.draw_landmarks(display, hand_lms, mp_hands.HAND_CONNECTIONS)

            # Draw status banner
            cv2.rectangle(display, (0, 0), (w, 45), (15, 23, 42), -1)
            status_text = f"Frame {current_idx[0]}/{total_frames - 1} | Hands: {len(hand_res.multi_hand_landmarks or [])} | Press SPACE/ENTER to Confirm"
            cv2.putText(display, status_text, (15, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (56, 189, 248), 2)

            cv2.imshow(window_name, display)
            key = cv2.waitKey(30) & 0xFF
            if key in [32, 13]:  # Space or Enter
                selected_frame_idx = current_idx[0]
                print(f"[INFO] Frame {selected_frame_idx} selected by user.")
                break
            elif key in [27, ord('q')]:  # Esc or Q
                selected_frame_idx = current_idx[0]
                break

        cv2.destroyAllWindows()

    # Read the chosen frame for deep analysis
    cap.set(cv2.CAP_PROP_POS_FRAMES, selected_frame_idx)
    ret, chosen_frame = cap.read()
    cap.release()

    if not ret or chosen_frame is None:
        raise RuntimeError(f"Failed to read frame {selected_frame_idx} from video.")

    rgb_frame = cv2.cvtColor(chosen_frame, cv2.COLOR_BGR2RGB)
    hand_res = hands.process(rgb_frame)
    pose_res = pose.process(rgb_frame)

    if not hand_res.multi_hand_landmarks or len(hand_res.multi_hand_landmarks) == 0:
        print(f"[WARNING] No hand landmarks found in frame {selected_frame_idx}!")
        print("[INFO] Scanning adjacent frames for hand detection...")
        # Auto-scan nearby frames
        cap = cv2.VideoCapture(video_path)
        for offset in range(-15, 16):
            f_idx = min(max(selected_frame_idx + offset, 0), total_frames - 1)
            cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
            r, f = cap.read()
            if r and f is not None:
                h_res = hands.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
                if h_res.multi_hand_landmarks:
                    print(f"[INFO] Found clear hand landmarks in nearby frame: {f_idx}")
                    hand_res = h_res
                    chosen_frame = f
                    selected_frame_idx = f_idx
                    break
        cap.release()

    if not hand_res.multi_hand_landmarks:
        raise ValueError("Could not detect hand landmarks in the video. Ensure the hand is clearly visible.")

    primary_hand = hand_res.multi_hand_landmarks[0]
    pose_landmarks = pose_res.pose_landmarks.landmark if pose_res.pose_landmarks else None

    # Perform geometric feature extraction
    analyzer = SignPoseAnalyzer(gesture_name=gesture_name)
    hand_features = analyzer.analyze_hand_geometry(primary_hand.landmark)
    face_features = analyzer.analyze_face_relative_position(primary_hand.landmark, pose_landmarks)

    # Synthesize Python detection code
    generated_code = analyzer.generate_python_code(hand_features, face_features)

    # Save output if path given
    if output_py:
        with open(output_py, "w", encoding="utf-8") as f:
            f.write(generated_code)
        print(f"[SUCCESS] Generated detection code saved to: {output_py}")

    # Save keyframe snapshot image with landmarks for visual record
    snapshot_path = f"keyframe_{gesture_name.lower()}_{selected_frame_idx}.jpg"
    mp_draw.draw_landmarks(chosen_frame, primary_hand, mp_hands.HAND_CONNECTIONS)
    cv2.imwrite(snapshot_path, chosen_frame)
    print(f"[INFO] Saved keyframe preview with skeleton overlay: {snapshot_path}")

    summary = {
        "gesture_name": gesture_name,
        "video_path": video_path,
        "selected_frame": selected_frame_idx,
        "hand_features": hand_features,
        "face_features": face_features,
        "raw_landmarks_21": [
            {"index": i, "x": round(lm.x, 4), "y": round(lm.y, 4), "z": round(lm.z, 4)}
            for i, lm in enumerate(primary_hand.landmark)
        ]
    }

    return summary, generated_code


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sign Language Pose Extractor & Python Rule Synthesizer")
    parser.add_argument("--video", "-v", type=str, default="dist/DictionaryMovies/Animals_birds_insect/cow_2.mp4",
                        help="Path to the sign gesture MP4 video")
    parser.add_argument("--frame", "-f", type=int, default=None,
                        help="Exact frame index to analyze (if omitted, opens interactive scrubber)")
    parser.add_argument("--gesture-name", "-g", type=str, default="Cow",
                        help="Name of the sign language gesture (e.g. Cow, Tree, ThankYou)")
    parser.add_argument("--auto", action="store_true",
                        help="Run without GUI using automated frame selection")
    parser.add_argument("--output", "-o", type=str, default="generated_cow_detector.py",
                        help="Output python file path to write generated code")

    args = parser.parse_args()

    # Check video path fallback if not found directly
    video_file = args.video
    if not os.path.exists(video_file):
        candidates = [
            os.path.join("dist", "DictionaryMovies", "Animals_birds_insect", "cow_2.mp4"),
            os.path.join("public", "DictionaryMovies", "Animals_birds_insect", "cow_2.mp4"),
            "cow_2.mp4"
        ]
        for c in candidates:
            if os.path.exists(c):
                video_file = c
                break

    interactive_mode = not args.auto

    print("\n" + "=" * 60)
    print(f"  EXTRACTING LANDMARKS & SYNTHESIZING DETECTION RULES: {args.gesture_name}")
    print(f"  Video Source: {video_file}")
    print("=" * 60)

    summary_data, code = run_extraction(
        video_path=video_file,
        target_frame=args.frame,
        gesture_name=args.gesture_name,
        interactive=interactive_mode,
        output_py=args.output
    )

    print("\n" + "=" * 60)
    print("  EXTRACTED GEOMETRIC FEATURES (SUMMARY)")
    print("=" * 60)
    print(json.dumps({
        "finger_states": summary_data["hand_features"]["finger_states"],
        "normalized_distances": summary_data["hand_features"]["normalized_distances"],
        "face_relative": summary_data["face_features"]
    }, indent=2))

    print("\n" + "=" * 60)
    print("  AUTOMATICALLY GENERATED PYTHON DETECTION CODE:")
    print("=" * 60)
    print(code)
