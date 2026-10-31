import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("  SignVerse FastAPI Sign-to-Text Recognition Server")
    print("  WebSocket Endpoint: ws://localhost:8000/ws/sign-to-text")
    print("  REST Docs:          http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
