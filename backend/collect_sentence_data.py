#!/usr/bin/env python3
"""
SignVerse Sentence & Sequence Data Collection Tool
==================================================
Records 30-frame temporal landmark sequences from webcam or MediaPipe Hands
and saves them as structured dataset files for training multi-gesture LSTM models.

Usage:
  python collect_sentence_data.py --sign GOOD --samples 30
  python collect_sentence_data.py --sign MORNING --samples 30
  python collect_sentence_data.py --sign NAMASTE --samples 30
  python collect_sentence_data.py --sign THANK_YOU --samples 30
  python collect_sentence_data.py --sign PLEASE --samples 30
  python collect_sentence_data.py --sign HELP --samples 30
"""

import os
import sys
import json
import time
import math
import argparse

try:
    import cv2
    import numpy as np
    import mediapipe as mp
    DEPS_AVAILABLE = True
except ImportError:
    DEPS_AVAILABLE = False


def record_samples(sign_name, num_samples=30, output_dir="data"):
    if not DEPS_AVAILABLE:
        print("[Error] OpenCV, NumPy, and MediaPipe are required to run the live collector.")
        print("Run: pip install opencv-python mediapipe numpy")
        return

    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, f"sequences_{sign_name.lower()}.json")

    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("[Error] Could not open webcam.")
        return

    print(f"\n==========================================")
    print(f" Recording Sign: '{sign_name}' ({num_samples} sequences)")
    print(f" Press SPACE to start capturing a 30-frame sequence")
    print(f" Press 'q' to quit at any time")
    print(f"==========================================\n")

    captured_sequences = []
    current_buffer = []
    is_recording = False

    while cap.isOpened() and len(captured_sequences) < num_samples:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)

        status_text = f"Samples: {len(captured_sequences)}/{num_samples}"
        cv2.putText(frame, f"Sign: {sign_name} | {status_text}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (124, 169, 146), 2)

        if results.multi_hand_landmarks:
            landmarks = results.multi_hand_landmarks[0].landmark
            wrist = landmarks[0]
            middle_mcp = landmarks[9]
            palm_scale = max(np.hypot(middle_mcp.x - wrist.x, middle_mcp.y - wrist.y), 0.04)

            # 63 features normalized to wrist & palm scale
            frame_features = []
            for lm in landmarks:
                frame_features.extend([
                    (lm.x - wrist.x) / palm_scale,
                    (lm.y - wrist.y) / palm_scale,
                    (lm.z - wrist.z) / palm_scale
                ])

            if is_recording:
                current_buffer.append(frame_features)
                cv2.circle(frame, (w - 40, 40), 15, (0, 0, 255), -1)
                cv2.putText(frame, f"REC: {len(current_buffer)}/30", (w - 150, 45),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

                if len(current_buffer) == 30:
                    captured_sequences.append(current_buffer)
                    current_buffer = []
                    is_recording = False
                    print(f"[Captured] Sequence {len(captured_sequences)}/{num_samples} for '{sign_name}'")
        else:
            if is_recording:
                cv2.putText(frame, "HAND LOST", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        cv2.imshow(f"SignVerse Data Collector - {sign_name}", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord(' '):
            if not is_recording:
                is_recording = True
                current_buffer = []
        elif key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    if captured_sequences:
        with open(out_file, "w") as f:
            json.dump({
                "sign": sign_name,
                "num_sequences": len(captured_sequences),
                "sequence_length": 30,
                "feature_dim": 63,
                "data": captured_sequences
            }, f, indent=2)
        print(f"\n[Saved] Successfully exported {len(captured_sequences)} sequences to '{out_file}'\n")


def generate_synthetic_sign_data(sign_name="SITE", num_samples=30, output_dir="data"):
    """
    Generates realistic 30-frame MediaPipe landmark sequences for training the SITE gesture
    (L-Handshape: Index upright, Thumb extended at 90 deg, Middle/Ring/Pinky folded).
    Works without requiring camera access or display drivers.
    """
    import random
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, f"sequences_{sign_name.lower()}.json")

    print(f"\n[Synthetic Generator] Generating {num_samples} 30-frame landmark sequences for '{sign_name}'...")

    captured_sequences = []
    for s in range(num_samples):
        # Base palm scale and tilt variation per sample
        scale = random.uniform(0.85, 1.15)
        angle = random.uniform(-0.15, 0.15) # tilt in radians
        drift_x = random.uniform(-0.02, 0.02)
        drift_y = random.uniform(-0.02, 0.02)

        sequence = []
        for frame_idx in range(30):
            # Frame temporal progress
            prog = frame_idx / 30.0
            t_offset_x = math.sin(prog * math.pi) * 0.015 + drift_x
            t_offset_y = math.cos(prog * math.pi) * 0.010 + drift_y

            # 21 MediaPipe hand landmarks in canonical L-hand configuration
            wrist_x, wrist_y = 0.5 + t_offset_x, 0.7 + t_offset_y

            def pt(rx, ry, rz=0.0):
                # Rotate and scale relative to wrist
                rot_x = rx * math.cos(angle) - ry * math.sin(angle)
                rot_y = rx * math.sin(angle) + ry * math.cos(angle)
                x = wrist_x + rot_x * scale + random.gauss(0, 0.003)
                y = wrist_y + rot_y * scale + random.gauss(0, 0.003)
                z = rz * scale + random.gauss(0, 0.002)
                return [x, y, z]

            # Canonical L-Hand landmarks
            landmarks = [
                pt(0.00, 0.00),         # 0 Wrist
                pt(-0.05, -0.04),       # 1 Thumb CMC
                pt(-0.09, -0.09),       # 2 Thumb MCP
                pt(-0.14, -0.13),       # 3 Thumb IP
                pt(-0.19, -0.15),       # 4 Thumb Tip (Extended outward ~90 deg)
                pt(-0.04, -0.18),       # 5 Index MCP
                pt(-0.04, -0.27),       # 6 Index PIP
                pt(-0.04, -0.34),       # 7 Index DIP
                pt(-0.04, -0.42),       # 8 Index Tip (Extended straight upright)
                pt(0.00, -0.17),        # 9 Middle MCP
                pt(0.00, -0.23),        # 10 Middle PIP (Curled)
                pt(0.00, -0.17),        # 11 Middle DIP (Curled)
                pt(0.00, -0.12),        # 12 Middle Tip (Curled to palm)
                pt(0.04, -0.16),        # 13 Ring MCP
                pt(0.04, -0.22),        # 14 Ring PIP (Curled)
                pt(0.04, -0.16),        # 15 Ring DIP (Curled)
                pt(0.04, -0.12),        # 16 Ring Tip (Curled to palm)
                pt(0.08, -0.14),        # 17 Pinky MCP
                pt(0.08, -0.19),        # 18 Pinky PIP (Curled)
                pt(0.08, -0.14),        # 19 Pinky DIP (Curled)
                pt(0.08, -0.11),        # 20 Pinky Tip (Curled to palm)
            ]

            # 63 features normalized to wrist & palm scale
            p_scale = max(math.hypot(landmarks[9][0] - landmarks[0][0], landmarks[9][1] - landmarks[0][1]), 0.04)
            frame_feats = []
            for lm in landmarks:
                frame_feats.extend([
                    (lm[0] - landmarks[0][0]) / p_scale,
                    (lm[1] - landmarks[0][1]) / p_scale,
                    (lm[2] - landmarks[0][2]) / p_scale
                ])
            sequence.append(frame_feats)
        captured_sequences.append(sequence)

    with open(out_file, "w") as f:
        json.dump({
            "sign": sign_name,
            "num_sequences": len(captured_sequences),
            "sequence_length": 30,
            "feature_dim": 63,
            "data": captured_sequences
        }, f, indent=2)
    print(f"[Synthetic Success] Exported {len(captured_sequences)} sequences to '{out_file}'\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SignVerse Temporal Sequence Collector & Training Generator")
    parser.add_argument("--sign", type=str, default="SITE", help="Target component sign label (e.g. SITE, L_HAND, GOOD, MORNING, NAMASTE, THANK_YOU, PLEASE, HELP)")
    parser.add_argument("--samples", type=int, default=30, help="Number of 30-frame sequences to capture")
    parser.add_argument("--dir", type=str, default="data", help="Output directory")
    parser.add_argument("--synthetic", action="store_true", help="Generate synthetic landmark sequences for headless/scripted environments")
    args = parser.parse_args()

    if args.synthetic:
        generate_synthetic_sign_data(args.sign, args.samples, args.dir)
    else:
        record_samples(args.sign, args.samples, args.dir)
