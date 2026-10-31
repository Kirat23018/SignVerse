import math
from typing import Dict, Any, List, Optional, Tuple

class LandmarkPoint:
    def __init__(self, x: float, y: float, z: float = 0.0):
        self.x = x
        self.y = y
        self.z = z

def euclidean_distance(p1: Any, p2: Any) -> float:
    """Calculate Euclidean distance between two 2D/3D points."""
    return math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2)

class HandGestureDetector:
    """
    Gesture detector using pure landmark geometry (distances, relative positions, angles).
    Detects 5 primary static signs without complex ML models:
      1. Thumbs Up -> "Yes"
      2. Open Palm -> "Stop"
      3. Peace Sign -> "Victory"
      4. Fist -> "Rock"
      5. Index Finger Up -> "One"
    """

    # Landmark indices for MediaPipe Hands
    WRIST = 0
    THUMB_CMC = 1
    THUMB_MCP = 2
    THUMB_IP = 3
    THUMB_TIP = 4

    INDEX_MCP = 5
    INDEX_PIP = 6
    INDEX_DIP = 7
    INDEX_TIP = 8

    MIDDLE_MCP = 9
    MIDDLE_PIP = 10
    MIDDLE_DIP = 11
    MIDDLE_TIP = 12

    RING_MCP = 13
    RING_PIP = 14
    RING_DIP = 15
    RING_TIP = 16

    PINKY_MCP = 17
    PINKY_PIP = 18
    PINKY_DIP = 19
    PINKY_TIP = 20

    def __init__(self):
        pass

    def _is_finger_extended(self, landmarks: List[Any], mcp_idx: int, pip_idx: int, tip_idx: int) -> bool:
        """
        Check if a regular finger (index, middle, ring, pinky) is extended.
        Uses both wrist-relative distance and MCP distance for robust orientation tolerance.
        """
        wrist = landmarks[self.WRIST]
        mcp = landmarks[mcp_idx]
        pip = landmarks[pip_idx]
        tip = landmarks[tip_idx]

        dist_wrist_tip = euclidean_distance(wrist, tip)
        dist_wrist_pip = euclidean_distance(wrist, pip)
        dist_mcp_tip = euclidean_distance(mcp, tip)
        dist_mcp_pip = euclidean_distance(mcp, pip)

        # Extended if tip is clearly further from wrist and MCP than the PIP joint
        # Also, in an upright orientation, tip.y is less than pip.y
        is_farther = (dist_wrist_tip > dist_wrist_pip * 1.12) and (dist_mcp_tip > dist_mcp_pip * 1.30)
        is_above = tip.y < pip.y

        return is_farther and is_above

    def _is_thumb_up(self, landmarks: List[Any]) -> bool:
        """
        Check if the thumb is pointing distinctly upward (for Thumbs Up).
        """
        wrist = landmarks[self.WRIST]
        thumb_tip = landmarks[self.THUMB_TIP]
        thumb_ip = landmarks[self.THUMB_IP]
        thumb_mcp = landmarks[self.THUMB_MCP]
        index_mcp = landmarks[self.INDEX_MCP]

        # Thumb tip must be significantly above thumb IP, MCP, and index MCP (lower y)
        is_upward = (
            thumb_tip.y < thumb_ip.y - 0.03
            and thumb_tip.y < thumb_mcp.y - 0.05
            and thumb_tip.y < index_mcp.y - 0.04
        )
        # Thumb tip is higher than all other fingertips
        is_highest = (
            thumb_tip.y < landmarks[self.INDEX_TIP].y
            and thumb_tip.y < landmarks[self.MIDDLE_TIP].y
            and thumb_tip.y < landmarks[self.RING_TIP].y
            and thumb_tip.y < landmarks[self.PINKY_TIP].y
        )
        return is_upward and is_highest

    def _is_thumb_extended_open(self, landmarks: List[Any]) -> bool:
        """
        Check if thumb is extended outward away from palm (for Open Palm).
        """
        thumb_tip = landmarks[self.THUMB_TIP]
        index_mcp = landmarks[self.INDEX_MCP]
        wrist = landmarks[self.WRIST]

        # Distance from thumb tip to index MCP should be wide
        dist_thumb_index = euclidean_distance(thumb_tip, index_mcp)
        dist_thumb_wrist = euclidean_distance(thumb_tip, wrist)
        dist_mcp_wrist = euclidean_distance(landmarks[self.THUMB_MCP], wrist)

        return dist_thumb_index > 0.09 and dist_thumb_wrist > dist_mcp_wrist * 1.15

    def detect(self, landmarks: List[Any]) -> Dict[str, Any]:
        """
        Analyzes 21 landmarks and classifies the gesture.
        Returns dictionary with gesture name, translated text, confidence, and finger states.
        """
        if not landmarks or len(landmarks) < 21:
            return {
                "gesture": "None",
                "text": "",
                "confidence": 0.0,
                "landmarks_detected": False,
                "fingers": {}
            }

        # Analyze individual finger states
        index_extended = self._is_finger_extended(landmarks, self.INDEX_MCP, self.INDEX_PIP, self.INDEX_TIP)
        middle_extended = self._is_finger_extended(landmarks, self.MIDDLE_MCP, self.MIDDLE_PIP, self.MIDDLE_TIP)
        ring_extended = self._is_finger_extended(landmarks, self.RING_MCP, self.RING_PIP, self.RING_TIP)
        pinky_extended = self._is_finger_extended(landmarks, self.PINKY_MCP, self.PINKY_PIP, self.PINKY_TIP)

        thumb_up = self._is_thumb_up(landmarks)
        thumb_open = self._is_thumb_extended_open(landmarks)

        fingers_state = {
            "thumb_up": thumb_up,
            "thumb_open": thumb_open,
            "index": index_extended,
            "middle": middle_extended,
            "ring": ring_extended,
            "pinky": pinky_extended
        }

        # Distance between index tip and middle tip (used for Peace Sign separation)
        index_middle_dist = euclidean_distance(landmarks[self.INDEX_TIP], landmarks[self.MIDDLE_TIP])

        # 1. Thumbs Up -> "Yes"
        # Thumb pointing up, all other 4 fingers curled
        if thumb_up and not index_extended and not middle_extended and not ring_extended and not pinky_extended:
            return {
                "gesture": "Thumbs Up",
                "text": "Yes",
                "confidence": 0.98,
                "landmarks_detected": True,
                "fingers": fingers_state
            }

        # 2. Open Palm -> "Stop"
        # All 5 fingers extended outward
        if index_extended and middle_extended and ring_extended and pinky_extended:
            return {
                "gesture": "Open Palm",
                "text": "Stop",
                "confidence": 0.96,
                "landmarks_detected": True,
                "fingers": fingers_state
            }

        # 3. Peace Sign -> "Victory"
        # Index and Middle fingers extended, Ring and Pinky folded, Thumb folded across
        if index_extended and middle_extended and not ring_extended and not pinky_extended and not thumb_up:
            # Check for V separation between index and middle
            if index_middle_dist > 0.03:
                return {
                    "gesture": "Peace Sign",
                    "text": "Victory",
                    "confidence": 0.95,
                    "landmarks_detected": True,
                    "fingers": fingers_state
                }

        # 4. Index Finger Up -> "One"
        # Only index finger extended, middle, ring, pinky folded, thumb not up
        if index_extended and not middle_extended and not ring_extended and not pinky_extended and not thumb_up:
            return {
                "gesture": "Index Finger Up",
                "text": "One",
                "confidence": 0.94,
                "landmarks_detected": True,
                "fingers": fingers_state
            }

        # 5. Fist -> "Rock"
        # All 4 fingers curled into fist, thumb tucked/folded, no fingers extended
        if not index_extended and not middle_extended and not ring_extended and not pinky_extended and not thumb_up:
            # Ensure tips are close to MCP / palm
            index_dist = euclidean_distance(landmarks[self.INDEX_TIP], landmarks[self.INDEX_MCP])
            middle_dist = euclidean_distance(landmarks[self.MIDDLE_TIP], landmarks[self.MIDDLE_MCP])
            
            # Tips are folded close to knuckles
            if index_dist < 0.18 and middle_dist < 0.18:
                return {
                    "gesture": "Fist",
                    "text": "Rock",
                    "confidence": 0.92,
                    "landmarks_detected": True,
                    "fingers": fingers_state
                }

        # If hand detected but doesn't match one of the 5 exact gestures
        return {
            "gesture": "Unknown",
            "text": "",
            "confidence": 0.30,
            "landmarks_detected": True,
            "fingers": fingers_state
        }
