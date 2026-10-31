import unittest
from extract_pose_rules import SignPoseAnalyzer, SimplePoint

class TestSignPoseAnalyzer(unittest.TestCase):
    def setUp(self):
        self.analyzer = SignPoseAnalyzer(gesture_name="Cow")

    def test_analyzer_and_code_generation(self):
        # 21 synthetic landmarks for 'Cow' (horns: thumb and pinky extended, index/middle/ring folded)
        landmarks = [SimplePoint(0.5, 0.8) for _ in range(21)]
        # Wrist at (0.5, 0.8)
        landmarks[0] = SimplePoint(0.5, 0.8)
        
        # Middle MCP at (0.5, 0.6) -> palm scale = 0.2
        landmarks[9] = SimplePoint(0.5, 0.6)
        landmarks[5] = SimplePoint(0.45, 0.62)
        landmarks[17] = SimplePoint(0.55, 0.65)

        # Thumb extended outwards
        landmarks[2] = SimplePoint(0.42, 0.70)
        landmarks[4] = SimplePoint(0.25, 0.55) # thumb tip far out

        # Pinky extended outwards/upwards
        landmarks[18] = SimplePoint(0.58, 0.55)
        landmarks[20] = SimplePoint(0.65, 0.45) # pinky tip far out

        # Fold index, middle, ring
        for mcp, pip, tip in [(5, 6, 8), (9, 10, 12), (13, 14, 16)]:
            landmarks[pip] = SimplePoint(landmarks[mcp].x, landmarks[mcp].y - 0.03)
            landmarks[tip] = SimplePoint(landmarks[mcp].x, landmarks[mcp].y + 0.02)

        hand_features = self.analyzer.analyze_hand_geometry(landmarks)
        self.assertTrue(hand_features["finger_states"]["thumb_extended"])
        self.assertTrue(hand_features["finger_states"]["pinky_extended"])
        self.assertFalse(hand_features["finger_states"]["index_extended"])
        self.assertFalse(hand_features["finger_states"]["middle_extended"])
        self.assertFalse(hand_features["finger_states"]["ring_extended"])

        # Synthetic Pose near ear
        pose_lms = [SimplePoint(0.5, 0.4) for _ in range(33)]
        pose_lms[7] = SimplePoint(0.35, 0.35) # left ear
        pose_lms[8] = SimplePoint(0.65, 0.35) # right ear

        face_features = self.analyzer.analyze_face_relative_position(landmarks, pose_lms)
        self.assertTrue(face_features["face_tracking"])

        # Generate Python Code
        code = self.analyzer.generate_python_code(hand_features, face_features)
        self.assertIn("def is_cow_pose", code)
        self.assertIn("thumb_extended", code)
        self.assertIn("pinky_extended", code)

        print("[OK] TestSignPoseAnalyzer passed successfully!")

if __name__ == "__main__":
    unittest.main()
