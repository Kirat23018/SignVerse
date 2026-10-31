import unittest
from gesture_detector import HandGestureDetector, LandmarkPoint

class TestGestureDetector(unittest.TestCase):
    def setUp(self):
        self.detector = HandGestureDetector()

    def _create_base_hand(self):
        # 21 landmarks initialized to wrist at (0.5, 0.8)
        landmarks = [LandmarkPoint(0.5, 0.8, 0.0) for _ in range(21)]
        # Set realistic MCP knuckles at y=0.5
        landmarks[1] = LandmarkPoint(0.45, 0.65) # thumb cmc
        landmarks[2] = LandmarkPoint(0.42, 0.58) # thumb mcp
        landmarks[3] = LandmarkPoint(0.40, 0.50) # thumb ip
        landmarks[4] = LandmarkPoint(0.38, 0.44) # thumb tip

        landmarks[5] = LandmarkPoint(0.44, 0.50) # index mcp
        landmarks[6] = LandmarkPoint(0.44, 0.40) # index pip
        landmarks[7] = LandmarkPoint(0.44, 0.35) # index dip
        landmarks[8] = LandmarkPoint(0.44, 0.30) # index tip

        landmarks[9] = LandmarkPoint(0.50, 0.48) # middle mcp
        landmarks[10] = LandmarkPoint(0.50, 0.38) # middle pip
        landmarks[11] = LandmarkPoint(0.50, 0.32) # middle dip
        landmarks[12] = LandmarkPoint(0.50, 0.26) # middle tip

        landmarks[13] = LandmarkPoint(0.56, 0.50) # ring mcp
        landmarks[14] = LandmarkPoint(0.56, 0.41) # ring pip
        landmarks[15] = LandmarkPoint(0.56, 0.35) # ring dip
        landmarks[16] = LandmarkPoint(0.56, 0.30) # ring tip

        landmarks[17] = LandmarkPoint(0.62, 0.53) # pinky mcp
        landmarks[18] = LandmarkPoint(0.62, 0.46) # pinky pip
        landmarks[19] = LandmarkPoint(0.62, 0.41) # pinky dip
        landmarks[20] = LandmarkPoint(0.62, 0.36) # pinky tip
        return landmarks

    def _fold_finger(self, landmarks, mcp_idx, pip_idx, dip_idx, tip_idx):
        # Fold finger so tip rests near MCP knuckle
        mcp = landmarks[mcp_idx]
        landmarks[pip_idx] = LandmarkPoint(mcp.x, mcp.y - 0.05)
        landmarks[dip_idx] = LandmarkPoint(mcp.x, mcp.y + 0.02)
        landmarks[tip_idx] = LandmarkPoint(mcp.x, mcp.y + 0.04)

    def test_open_palm(self):
        landmarks = self._create_base_hand()
        # In base hand, all fingers are extended
        landmarks[4] = LandmarkPoint(0.30, 0.48) # thumb extended out
        res = self.detector.detect(landmarks)
        self.assertEqual(res["gesture"], "Open Palm")
        self.assertEqual(res["text"], "Stop")

    def test_thumbs_up(self):
        landmarks = self._create_base_hand()
        # Fold all 4 fingers
        self._fold_finger(landmarks, 5, 6, 7, 8)
        self._fold_finger(landmarks, 9, 10, 11, 12)
        self._fold_finger(landmarks, 13, 14, 15, 16)
        self._fold_finger(landmarks, 17, 18, 19, 20)
        # Thumb pointing straight UP high
        landmarks[1] = LandmarkPoint(0.45, 0.65)
        landmarks[2] = LandmarkPoint(0.42, 0.55)
        landmarks[3] = LandmarkPoint(0.40, 0.40)
        landmarks[4] = LandmarkPoint(0.40, 0.20) # high up (lowest y)

        res = self.detector.detect(landmarks)
        self.assertEqual(res["gesture"], "Thumbs Up")
        self.assertEqual(res["text"], "Yes")

    def test_peace_sign(self):
        landmarks = self._create_base_hand()
        # Index and middle extended, ring and pinky folded
        self._fold_finger(landmarks, 13, 14, 15, 16)
        self._fold_finger(landmarks, 17, 18, 19, 20)
        # Thumb folded across
        landmarks[4] = LandmarkPoint(0.50, 0.55)
        # Separate index and middle
        landmarks[8] = LandmarkPoint(0.42, 0.28)
        landmarks[12] = LandmarkPoint(0.53, 0.26)

        res = self.detector.detect(landmarks)
        self.assertEqual(res["gesture"], "Peace Sign")
        self.assertEqual(res["text"], "Victory")

    def test_index_finger_up(self):
        landmarks = self._create_base_hand()
        # Fold middle, ring, pinky
        self._fold_finger(landmarks, 9, 10, 11, 12)
        self._fold_finger(landmarks, 13, 14, 15, 16)
        self._fold_finger(landmarks, 17, 18, 19, 20)
        # Thumb tucked
        landmarks[4] = LandmarkPoint(0.48, 0.55)

        res = self.detector.detect(landmarks)
        self.assertEqual(res["gesture"], "Index Finger Up")
        self.assertEqual(res["text"], "One")

    def test_fist(self):
        landmarks = self._create_base_hand()
        # Fold all fingers
        self._fold_finger(landmarks, 5, 6, 7, 8)
        self._fold_finger(landmarks, 9, 10, 11, 12)
        self._fold_finger(landmarks, 13, 14, 15, 16)
        self._fold_finger(landmarks, 17, 18, 19, 20)
        # Thumb wrapped over fingers
        landmarks[4] = LandmarkPoint(0.48, 0.52)

        res = self.detector.detect(landmarks)
        self.assertEqual(res["gesture"], "Fist")
        self.assertEqual(res["text"], "Rock")

if __name__ == "__main__":
    unittest.main()
