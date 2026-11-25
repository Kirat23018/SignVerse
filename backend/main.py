import base64
import json
import logging
import os
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

MAX_FRAME_PAYLOAD_CHARS = 2_800_000
MAX_DECODED_BYTES = 2 * 1024 * 1024
MAX_IMAGE_DIMENSION = 2048

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://sign-verse-tau.vercel.app",
]


def get_allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "")
    if not raw.strip():
        return DEFAULT_ALLOWED_ORIGINS
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return [o for o in origins if o != "*"] or DEFAULT_ALLOWED_ORIGINS


app = FastAPI(
    title="SignVerse Sign-to-Text Recognition API",
    description="Real-time static sign gesture detection powered by OpenCV, MediaPipe, and landmark geometry",
    version="1.0.0",
)

# Restrict CORS to explicit trusted origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
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
    Enforces strict size and dimension limits to prevent memory exhaustion / DoS.
    Returns OpenCV BGR image or None.
    """
    try:
        if not isinstance(data_str, str) or not data_str:
            return None
        if len(data_str) > MAX_FRAME_PAYLOAD_CHARS:
            logger.warning("Rejected oversized frame payload")
            return None

        if "," in data_str:
            data_str = data_str.split(",", 1)[1]

        image_bytes = base64.b64decode(data_str, validate=True)
        if not image_bytes or len(image_bytes) > MAX_DECODED_BYTES:
            logger.warning("Rejected invalid or oversized decoded image buffer")
            return None

        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return None

        height, width = frame.shape[:2]
        if height <= 0 or width <= 0 or height > MAX_IMAGE_DIMENSION or width > MAX_IMAGE_DIMENSION:
            logger.warning("Rejected frame with invalid dimensions: %sx%s", width, height)
            return None

        return frame
    except Exception:
        logger.warning("Error decoding base64 image")
        return None


@app.websocket("/ws/sign-to-text")
@app.websocket("/ws")
async def websocket_sign_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint that receives webcam frames (10 FPS) encoded as base64,
    processes hand landmarks with MediaPipe, and streams detected gesture immediately.
    """
    origin = websocket.headers.get("origin")
    if origin and origin not in get_allowed_origins():
        await websocket.close(code=1008)
        return

    await websocket.accept()
    client_host = websocket.client.host if websocket.client else "unknown"
    client_port = websocket.client.port if websocket.client else 0
    logger.info("Client connected from %s:%s", client_host, client_port)

    tracker = None
    try:
        tracker = get_hands_tracker()
    except Exception as e:
        logger.error("Cannot process gestures without MediaPipe: %s", e)
        await websocket.send_json({
            "status": "error",
            "message": "Vision pipeline unavailable. Please try again later.",
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
            if len(raw_msg) > MAX_FRAME_PAYLOAD_CHARS:
                await websocket.send_json({
                    "status": "payload_too_large",
                    "text": "",
                    "gesture": "None",
                    "confidence": 0.0,
                    "landmarks_detected": False
                })
                continue

            # Extract base64 image payload
            base64_payload = raw_msg
            if raw_msg.startswith("{"):
                try:
                    parsed = json.loads(raw_msg)
                    if isinstance(parsed, dict):
                        base64_payload = parsed.get("image") or parsed.get("frame") or ""
                    else:
                        base64_payload = ""
                except Exception:
                    base64_payload = ""

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
    dev_reload = os.getenv("SIGNVERSE_DEV_RELOAD", "false").lower() == "true"
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=dev_reload)
