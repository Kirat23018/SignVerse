import base64
import json
import logging
import time
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from gesture_detector import HandGestureDetector

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SignToTextServer")

app = FastAPI(
    title="SignVerse Sign-to-Text Recognition API",
    description="Real-time static sign gesture detection powered by OpenCV, MediaPipe, and landmark geometry",
    version="1.0.0",
)

# Enable CORS for Next.js frontend (standard ports 3000, 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize HandGestureDetector
detector = HandGestureDetector()

# Lazy/Safe initialization of MediaPipe Hands
mp_hands = None
hands_tracker = None

def get_hands_tracker():
    global mp_hands, hands_tracker
    if hands_tracker is None:
        try:
            import mediapipe as mp
            mp_hands = mp.solutions.hands
            hands_tracker = mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=1,
                model_complexity=0, # Fast mobile/web real-time processing
                min_detection_confidence=0.55,
                min_tracking_confidence=0.50,
            )
            logger.info("MediaPipe Hands pipeline initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize MediaPipe Hands: {e}")
            raise e
    return hands_tracker


@app.get("/")
def read_root():
    return {
        "service": "SignVerse Sign-to-Text Backend",
        "status": "online",
        "supported_signs": {
            "Thumbs Up": "Yes",
            "Open Palm": "Stop",
            "Peace Sign": "Victory",
            "Fist": "Rock",
            "Index Finger Up": "One"
        },
        "websocket_endpoint": "/ws/sign-to-text"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}


def decode_base64_frame(data_str: str) -> Optional[np.ndarray]:
    """
    Decodes base64 string (handles data URL scheme like 'data:image/jpeg;base64,...').
    Returns OpenCV BGR image or None.
    """
    try:
        if "," in data_str:
            data_str = data_str.split(",", 1)[1]
        
        image_bytes = base64.b64decode(data_str)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        logger.warning(f"Error decoding base64 image: {e}")
        return None


@app.websocket("/ws/sign-to-text")
@app.websocket("/ws")
async def websocket_sign_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint that receives webcam frames (10 FPS) encoded as base64,
    processes hand landmarks with MediaPipe, and streams detected gesture immediately.
    """
    await websocket.accept()
    logger.info(f"Client connected from {websocket.client.host}:{websocket.client.port}")

    tracker = None
    try:
        tracker = get_hands_tracker()
    except Exception as e:
        logger.error(f"Cannot process gestures without MediaPipe: {e}")
        await websocket.send_json({
            "status": "error",
            "message": f"MediaPipe initialization error: {str(e)}",
            "text": "",
            "gesture": "None"
        })
        await websocket.close()
        return

    fps_count = 0
    start_time = time.time()

    try:
        while True:
            # Receive raw text or JSON frame from client
            raw_msg = await websocket.receive_text()
            
            # Extract base64 image payload
            base64_payload = raw_msg
            if raw_msg.startswith("{"):
                try:
                    parsed = json.loads(raw_msg)
                    base64_payload = parsed.get("image") or parsed.get("frame") or ""
                except Exception:
                    pass

            if not base64_payload:
                await websocket.send_json({
                    "status": "empty_frame",
                    "text": "",
                    "gesture": "None",
                    "confidence": 0.0,
                    "landmarks_detected": False
                })
                continue

            # Decode frame
            frame = decode_base64_frame(base64_payload)
            if frame is None:
                await websocket.send_json({
                    "status": "decode_error",
                    "text": "",
                    "gesture": "None",
                    "confidence": 0.0,
                    "landmarks_detected": False
                })
                continue

            # Convert BGR to RGB for MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process frame with MediaPipe Hands
            results = tracker.process(rgb_frame)

            # Analyze hand landmarks
            if results.multi_hand_landmarks and len(results.multi_hand_landmarks) > 0:
                hand_landmarks = results.multi_hand_landmarks[0]
                detection_result = detector.detect(hand_landmarks.landmark)

                # Collect simplified landmark coordinates for frontend visualization
                key_landmarks = [
                    {"x": round(lm.x, 3), "y": round(lm.y, 3)}
                    for lm in hand_landmarks.landmark
                ]

                response_payload = {
                    "status": "success",
                    "text": detection_result["text"],
                    "gesture": detection_result["gesture"],
                    "confidence": detection_result["confidence"],
                    "landmarks_detected": True,
                    "fingers": detection_result["fingers"],
                    "landmarks": key_landmarks,
                    "timestamp": round(time.time(), 3)
                }
            else:
                response_payload = {
                    "status": "idle",
                    "text": "",
                    "gesture": "None",
                    "confidence": 0.0,
                    "landmarks_detected": False,
                    "fingers": {},
                    "landmarks": [],
                    "timestamp": round(time.time(), 3)
                }

            # Return recognition immediately through WebSocket
            await websocket.send_json(response_payload)

            fps_count += 1
            if time.time() - start_time > 5:
                # Log FPS rate every 5 seconds
                logger.info(f"Stream running smoothly: ~{fps_count / 5.0:.1f} FPS processed")
                fps_count = 0
                start_time = time.time()

    except WebSocketDisconnect:
        logger.info(f"Client {websocket.client.host} disconnected gracefully.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
