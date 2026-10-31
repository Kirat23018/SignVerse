# SignVerse Sign-to-Text FastAPI Backend

High-performance real-time hand gesture recognition backend powered by **FastAPI**, **OpenCV**, and **MediaPipe Hand Landmarks**.

## Features
- **Pure Geometric Landmark Detection**: Zero heavy ML inference latency. Calculates Euclidean distances, joint angles, and relative positions across 21 landmarks.
- **5 Supported Static Signs**:
  1. **Thumbs Up** ➔ `"Yes"`
  2. **Open Palm** ➔ `"Stop"`
  3. **Peace Sign** ➔ `"Victory"`
  4. **Fist** ➔ `"Rock"`
  5. **Index Finger Up** ➔ `"One"`
- **WebSocket Streaming**: Optimized for 10 FPS base64 JPEG video frames at `ws://localhost:8000/ws/sign-to-text`.
- **Landmark Extraction**: Returns tracked keypoints for real-time frontend skeleton overlays.

## Setup & Running

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Server
```bash
python run.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Endpoints
- **WebSocket**: `ws://localhost:8000/ws/sign-to-text`
- **Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

### 4. Running Unit Tests
```bash
python test_detector.py
```
