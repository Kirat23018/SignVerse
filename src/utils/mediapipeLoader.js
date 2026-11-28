/**
 * Shared MediaPipe CDN Loader, Frame Pacer, & Stream Lifecycle Utilities
 * Prevents duplicate script injections across camera routes and enforces
 * clean GPU/WASM frame backpressure and full webcam track release on unmount.
 */

const loadedScripts = new Map();

export function loadExternalScriptOnce(src, globalCheck) {
  if (typeof globalCheck === 'function' && globalCheck()) {
    return Promise.resolve();
  }

  if (loadedScripts.has(src)) {
    return loadedScripts.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (typeof globalCheck === 'function' && globalCheck()) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', (err) => {
        loadedScripts.delete(src);
        reject(err);
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = (err) => {
      loadedScripts.delete(src);
      reject(err);
    };
    document.head.appendChild(script);
  });

  loadedScripts.set(src, promise);
  return promise;
}

export async function loadMediaPipeHandsBundle({ withDrawingUtils = false } = {}) {
  const tasks = [
    loadExternalScriptOnce(
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      () => typeof window !== 'undefined' && Boolean(window.Camera)
    ),
    loadExternalScriptOnce(
      'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
      () => typeof window !== 'undefined' && Boolean(window.Hands)
    )
  ];

  if (withDrawingUtils) {
    tasks.push(
      loadExternalScriptOnce(
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        () => typeof window !== 'undefined' && Boolean(window.drawConnectors && window.drawLandmarks)
      )
    );
  }

  await Promise.all(tasks);
}

/**
 * Stops a MediaPipe Camera instance, closes Hands WASM graph, and releases all
 * underlying MediaStream tracks so the hardware camera LED shuts off immediately.
 */
export function cleanupCameraResources({ camera, hands, video, canvas }) {
  if (camera) {
    try {
      camera.stop();
    } catch {
      // Safe teardown
    }
  }

  if (hands) {
    try {
      hands.close();
    } catch {
      // Safe teardown
    }
  }

  if (video && video.srcObject && typeof video.srcObject.getTracks === 'function') {
    try {
      video.srcObject.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore already-stopped tracks
        }
      });
    } catch {
      // Ignore srcObject teardown errors
    }
  }

  if (canvas) {
    try {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    } catch {
      // Ignore canvas teardown errors
    }
  }
}

/**
 * Creates a throttled, backpressure-aware frame dispatcher for MediaPipe hands.send().
 * Prevents concurrent WASM invocations and skips redundant duplicate video frames.
 */
export function createFrameDispatcher({ minIntervalMs = 33 } = {}) {
  let isProcessing = false;
  let lastDispatchMs = 0;
  let lastVideoTime = -1;
  let totalProcessed = 0;
  let lastInferenceMs = 0;
  let avgInferenceMs = 0;

  return {
    async dispatch(video, hands, { isPaused = false } = {}) {
      if (isPaused || isProcessing || !video || !hands) return false;
      if (video.readyState < 2 || video.paused || video.ended) return false;

      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - lastDispatchMs < minIntervalMs) return false;

      const currentVideoTime = Number.isFinite(video.currentTime) ? video.currentTime : -1;
      if (currentVideoTime >= 0 && currentVideoTime === lastVideoTime) return false;

      isProcessing = true;
      lastDispatchMs = now;
      if (currentVideoTime >= 0) {
        lastVideoTime = currentVideoTime;
      }

      const start = now;
      try {
        await hands.send({ image: video });
        const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
        lastInferenceMs = Math.round((end - start) * 10) / 10;
        totalProcessed += 1;
        avgInferenceMs = totalProcessed === 1
          ? lastInferenceMs
          : Math.round((avgInferenceMs * 0.85 + lastInferenceMs * 0.15) * 10) / 10;
        return true;
      } finally {
        isProcessing = false;
      }
    },
    getMetrics() {
      return {
        totalProcessed,
        lastInferenceMs,
        avgInferenceMs,
        minIntervalMs
      };
    }
  };
}
