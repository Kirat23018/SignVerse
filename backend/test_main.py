import base64
import importlib
import os
import sys
import types
import unittest
from unittest.mock import patch


def _load_main_with_stubs():
    """Import backend/main.py even in minimal environments without OpenCV installed."""
    added = []
    if "cv2" not in sys.modules:
        fake_cv2 = types.ModuleType("cv2")
        fake_cv2.IMREAD_COLOR = 1
        fake_cv2.COLOR_BGR2RGB = 4
        fake_cv2.imdecode = lambda arr, flags: arr if getattr(arr, "size", 0) > 0 else None
        fake_cv2.cvtColor = lambda frame, code: frame
        sys.modules["cv2"] = fake_cv2
        added.append("cv2")

    if "numpy" not in sys.modules:
        fake_np = types.ModuleType("numpy")
        fake_np.uint8 = int

        class FakeArr:
            def __init__(self, b):
                self.size = len(b)
                self.shape = (480, 640, 3)

        fake_np.ndarray = FakeArr
        fake_np.frombuffer = lambda b, dtype=None: FakeArr(b)
        sys.modules["numpy"] = fake_np
        added.append("numpy")

    if "fastapi" not in sys.modules:
        fake_fastapi = types.ModuleType("fastapi")

        class FakeFastAPI:
            def __init__(self, *args, **kwargs):
                pass

            def add_middleware(self, *args, **kwargs):
                pass

            def get(self, *args, **kwargs):
                return lambda fn: fn

            def websocket(self, *args, **kwargs):
                return lambda fn: fn

        fake_fastapi.FastAPI = FakeFastAPI
        fake_fastapi.WebSocket = object
        fake_fastapi.WebSocketDisconnect = Exception
        sys.modules["fastapi"] = fake_fastapi
        added.append("fastapi")

        fake_cors_mod = types.ModuleType("fastapi.middleware.cors")
        fake_cors_mod.CORSMiddleware = object
        sys.modules["fastapi.middleware"] = types.ModuleType("fastapi.middleware")
        sys.modules["fastapi.middleware.cors"] = fake_cors_mod
        added.extend(["fastapi.middleware", "fastapi.middleware.cors"])

    main_mod = importlib.import_module("main")
    return main_mod, added


class TestBackendSecurityAndDecoding(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.main_mod, cls._stubbed = _load_main_with_stubs()

    @classmethod
    def tearDownClass(cls):
        for name in cls._stubbed:
            sys.modules.pop(name, None)

    def test_allowed_origins_rejects_wildcard_and_reads_env(self):
        with patch.dict(os.environ, {"ALLOWED_ORIGINS": "*"}):
            origins = self.main_mod.get_allowed_origins()
            self.assertNotIn("*", origins)
            self.assertEqual(origins, self.main_mod.DEFAULT_ALLOWED_ORIGINS)

        with patch.dict(os.environ, {"ALLOWED_ORIGINS": "https://sign-verse-tau.vercel.app, http://localhost:5173"}):
            origins = self.main_mod.get_allowed_origins()
            self.assertEqual(origins, ["https://sign-verse-tau.vercel.app", "http://localhost:5173"])

    def test_decode_base64_frame_rejects_invalid_and_oversized_payloads(self):
        self.assertIsNone(self.main_mod.decode_base64_frame(""))
        self.assertIsNone(self.main_mod.decode_base64_frame("not-valid-base64!!!"))
        oversized = "A" * (self.main_mod.MAX_FRAME_PAYLOAD_CHARS + 10)
        self.assertIsNone(self.main_mod.decode_base64_frame(oversized))

    def test_decode_base64_frame_accepts_valid_data_url_payload(self):
        sample = base64.b64encode(b"fake-jpeg-bytes").decode("ascii")
        frame = self.main_mod.decode_base64_frame(f"data:image/jpeg;base64,{sample}")
        self.assertIsNotNone(frame)


if __name__ == "__main__":
    unittest.main()

