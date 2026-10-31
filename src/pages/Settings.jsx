import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const [settings, setSettings] = useState({
    displayName: 'SignVerse Scholar',
    dialect: 'ISL',
    cameraId: '',
    trackingConfidence: 0.65,
    handPreference: 'right', // 'right' | 'left'
    avatarSpeed: 1.0,        // 0.75 | 1.0 | 1.25 | 1.5
    skeletonOverlay: true,
    cameraMirror: true,
    defaultAvatar: 'luna',
    soundFeedback: true
  });

  const [videoDevices, setVideoDevices] = useState([]);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const previewVideoRef = useRef(null);
  const previewStreamRef = useRef(null);

  // 1. Load saved preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('signverse_user_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({
          ...prev,
          ...parsed,
          trackingConfidence: parseFloat(parsed.trackingConfidence) || 0.65,
          avatarSpeed: parseFloat(parsed.avatarSpeed) || 1.0
        }));
      }
    } catch (e) {
      console.warn('Settings load error:', e);
    }
  }, []);

  // 2. Fetch connected videoinput devices via navigator.mediaDevices.enumerateDevices()
  const enumerateCameras = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        console.warn('enumerateDevices not supported in this browser environment.');
        return;
      }

      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoInputs = devices.filter((d) => d.kind === 'videoinput');

      if (videoInputs.length > 0 && !videoInputs[0].label && navigator.mediaDevices.getUserMedia) {
        try {
          const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setPermissionState('granted');
          testStream.getTracks().forEach((track) => track.stop());
          devices = await navigator.mediaDevices.enumerateDevices();
          videoInputs = devices.filter((d) => d.kind === 'videoinput');
        } catch (permErr) {
          console.warn('Camera permission request skipped or declined:', permErr);
          setPermissionState('denied');
        }
      } else if (videoInputs.length > 0 && videoInputs[0].label) {
        setPermissionState('granted');
      }

      setVideoDevices(videoInputs);

      if (videoInputs.length > 0) {
        setSettings((prev) => {
          if (!prev.cameraId || !videoInputs.some((d) => d.deviceId === prev.cameraId)) {
            return { ...prev, cameraId: videoInputs[0].deviceId };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error enumerating cameras:', err);
    }
  };

  useEffect(() => {
    enumerateCameras();

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', enumerateCameras);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', enumerateCameras);
      };
    }
  }, []);

  // 3. Live Camera Preview in Settings
  const startPreview = async (deviceId) => {
    stopPreview();
    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      previewStreamRef.current = stream;
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }
      setIsTestingCamera(true);
    } catch (err) {
      console.error('Error starting camera preview:', err);
      setIsTestingCamera(false);
    }
  };

  const stopPreview = () => {
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((track) => track.stop());
      previewStreamRef.current = null;
    }
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }
    setIsTestingCamera(false);
  };

  useEffect(() => {
    return () => stopPreview();
  }, []);

  // 4. Save handler
  const handleSave = () => {
    try {
      localStorage.setItem('signverse_user_settings', JSON.stringify(settings));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const getSensitivityLabel = (val) => {
    if (val < 0.4) return { text: 'Low / Permissive (Fastest Recall)', color: '#7CA992' };
    if (val <= 0.75) return { text: 'Optimal Balanced (Recommended)', color: '#7CA992' };
    return { text: 'High Precision (Requires Bright Lighting)', color: '#A3C7B5' };
  };

  const sensitivityInfo = getSensitivityLabel(settings.trackingConfidence);

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 65px)',
        backgroundColor: '#191C1A',
        color: '#E4EAE6',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflowX: 'hidden',
        padding: '40px 24px 90px'
      }}
    >
      {/* Soothing Sage Radial Ambient Glows */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '20%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 169, 146, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-10%',
          right: '15%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 169, 146, 0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* Header Breadcrumb & Title */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#9CAEA4', marginBottom: '10px' }}>
            <Link to="/" style={{ color: '#7CA992', textDecoration: 'none', fontWeight: '700' }}>Home</Link>
            <span>/</span>
            <span style={{ color: '#E4EAE6' }}>Settings</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  background: 'rgba(124, 169, 146, 0.12)',
                  border: '1px solid rgba(124, 169, 146, 0.25)',
                  color: '#7CA992',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  marginBottom: '10px'
                }}
              >
                <span>⚙️ HARDWARE & VISION CALIBRATION</span>
              </div>
              <h1 style={{ fontSize: '34px', fontWeight: '800', margin: 0, letterSpacing: '-0.8px', color: '#E4EAE6' }}>
                System <span style={{ color: '#7CA992' }}>Settings</span>
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: '14.5px', color: '#9CAEA4' }}>
                Fine-tune connected webcams, MediaPipe confidence thresholds, hand tracking geometry, and 3D WebGL speed.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleSave}
                style={{
                  padding: '12px 28px',
                  borderRadius: '12px',
                  background: '#7CA992',
                  border: '1px solid #7CA992',
                  color: '#191C1A',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Save Changes</span>
                <span>✓</span>
              </button>
            </div>
          </div>

          {savedSuccess && (
            <div
              style={{
                marginTop: '16px',
                background: '#242A27',
                border: '1px solid #7CA992',
                color: '#E4EAE6',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🌿</span>
              <span>Settings and hardware preferences saved successfully to browser storage.</span>
            </div>
          )}
        </div>

        {/* ================= 1. CAMERA INPUT SOURCE ================= */}
        <div
          style={{
            background: '#242A27',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '26px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#E4EAE6', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📷</span>
                <span>Camera Input Source</span>
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9CAEA4' }}>
                Select physical or virtual video capture hardware detected by your browser.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: '700',
                  color: permissionState === 'granted' ? '#7CA992' : permissionState === 'denied' ? '#ef4444' : '#9CAEA4',
                  background: permissionState === 'granted' ? 'rgba(124, 169, 146, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${permissionState === 'granted' ? 'rgba(124, 169, 146, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`
                }}
              >
                {permissionState === 'granted' ? '● Camera Access Granted' : permissionState === 'denied' ? '● Permission Denied' : '○ Standby'}
              </span>

              <button
                onClick={enumerateCameras}
                style={{
                  background: 'rgba(124, 169, 146, 0.12)',
                  border: '1px solid rgba(124, 169, 146, 0.25)',
                  color: '#7CA992',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🔄 Rescan Devices</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#7CA992', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Active Webcam Hardware
              </label>
              
              <select
                value={settings.cameraId}
                onChange={(e) => {
                  setSettings({ ...settings, cameraId: e.target.value });
                  if (isTestingCamera) {
                    startPreview(e.target.value);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '13px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#191C1A',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#E4EAE6',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {videoDevices.length > 0 ? (
                  videoDevices.map((dev, idx) => (
                    <option key={dev.deviceId || idx} value={dev.deviceId}>
                      {dev.label || `Connected Video Device ${idx + 1}`}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="">Default System Webcam (Integrated Camera)</option>
                    <option value="external_hd">External USB HD Webcam (Generic)</option>
                    <option value="virtual_cam">OBS / Virtual Video Source</option>
                  </>
                )}
              </select>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '12px' }}>
                <span style={{ color: '#9CAEA4' }}>
                  {videoDevices.length > 0
                    ? `${videoDevices.length} camera device(s) connected and verified.`
                    : 'System fallback device selected.'}
                </span>
                
                <button
                  type="button"
                  onClick={() => {
                    if (isTestingCamera) stopPreview();
                    else startPreview(settings.cameraId);
                  }}
                  style={{
                    background: isTestingCamera ? 'rgba(239, 68, 68, 0.15)' : 'rgba(124, 169, 146, 0.15)',
                    border: isTestingCamera ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(124, 169, 146, 0.3)',
                    color: isTestingCamera ? '#f87171' : '#7CA992',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {isTestingCamera ? '⏹ Stop Camera Test' : '▶ Test Camera Stream'}
                </button>
              </div>
            </div>

            {/* Live Test Stream */}
            {isTestingCamera && (
              <div
                style={{
                  marginTop: '10px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#191C1A',
                  border: '1px solid #7CA992',
                  position: 'relative',
                  aspectRatio: '16/9',
                  maxWidth: '480px'
                }}
              >
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: settings.cameraMirror ? 'scaleX(-1)' : 'none'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(25, 28, 26, 0.9)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#7CA992',
                    border: '1px solid rgba(124, 169, 146, 0.3)'
                  }}
                >
                  LIVE HARDWARE FEED • {settings.cameraMirror ? 'MIRRORED' : 'STANDARD'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= 2. AI TRACKING SENSITIVITY ================= */}
        <div
          style={{
            background: '#242A27',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '26px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#E4EAE6', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧠</span>
              <span>AI Tracking Sensitivity</span>
            </h2>

            <span
              style={{
                fontSize: '16px',
                fontWeight: '800',
                color: '#7CA992',
                background: 'rgba(124, 169, 146, 0.15)',
                padding: '4px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(124, 169, 146, 0.3)',
                letterSpacing: '0.4px'
              }}
            >
              {Number(settings.trackingConfidence).toFixed(2)}
            </span>
          </div>

          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#9CAEA4' }}>
            Dynamically adjust MediaPipe's <code style={{ color: '#7CA992' }}>minDetectionConfidence</code> threshold. Lower values detect hands quicker; higher values filter background noise.
          </p>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9CAEA4', marginBottom: '8px' }}>
              <span>0.10 (Permissive)</span>
              <span style={{ color: sensitivityInfo.color, fontWeight: '700' }}>
                Status: {sensitivityInfo.text}
              </span>
              <span>1.00 (Strict)</span>
            </div>

            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.trackingConfidence}
              onChange={(e) => setSettings({ ...settings, trackingConfidence: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
                outline: 'none',
                accentColor: '#7CA992',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        {/* ================= 3. HAND PREFERENCE ================= */}
        <div
          style={{
            background: '#242A27',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '26px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#E4EAE6', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✋</span>
            <span>Hand Preference</span>
          </h2>
          <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#9CAEA4' }}>
            Configures spatial thumb and finger orientation geometry to match your dominant signing hand.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Right Handed */}
            <button
              type="button"
              onClick={() => setSettings({ ...settings, handPreference: 'right' })}
              style={{
                padding: '16px 20px',
                borderRadius: '14px',
                background: settings.handPreference === 'right' ? 'rgba(124, 169, 146, 0.15)' : '#191C1A',
                border: settings.handPreference === 'right' ? '1.5px solid #7CA992' : '1px solid rgba(255, 255, 255, 0.08)',
                color: settings.handPreference === 'right' ? '#E4EAE6' : '#9CAEA4',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '24px' }}>✋</span>
                {settings.handPreference === 'right' && (
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#191C1A', background: '#7CA992', padding: '2px 8px', borderRadius: '6px' }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#E4EAE6' }}>Right-Handed</div>
              <div style={{ fontSize: '12px', color: '#9CAEA4', marginTop: '2px' }}>
                Standard geometric calibration (Default)
              </div>
            </button>

            {/* Left Handed */}
            <button
              type="button"
              onClick={() => setSettings({ ...settings, handPreference: 'left' })}
              style={{
                padding: '16px 20px',
                borderRadius: '14px',
                background: settings.handPreference === 'left' ? 'rgba(124, 169, 146, 0.15)' : '#191C1A',
                border: settings.handPreference === 'left' ? '1.5px solid #7CA992' : '1px solid rgba(255, 255, 255, 0.08)',
                color: settings.handPreference === 'left' ? '#E4EAE6' : '#9CAEA4',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '24px' }}>🤚</span>
                {settings.handPreference === 'left' && (
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#191C1A', background: '#7CA992', padding: '2px 8px', borderRadius: '6px' }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#E4EAE6' }}>Left-Handed</div>
              <div style={{ fontSize: '12px', color: '#9CAEA4', marginTop: '2px' }}>
                Inverted geometric thumb & angle detection
              </div>
            </button>
          </div>
        </div>

        {/* ================= 4. AVATAR RENDER SPEED ================= */}
        <div
          style={{
            background: '#242A27',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '26px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#E4EAE6', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span>
            <span>Avatar Render Speed</span>
          </h2>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#9CAEA4' }}>
            Control the 3D WebGL animation playback speed in Text-to-Sign drills and Academy lessons.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#7CA992', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Playback Velocity
            </label>
            <select
              value={settings.avatarSpeed}
              onChange={(e) => setSettings({ ...settings, avatarSpeed: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '12px',
                backgroundColor: '#191C1A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E4EAE6',
                fontSize: '14px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="0.75">0.75x — Deliberate (Slow Motion Study for Beginners)</option>
              <option value="1.0">1.0x — Natural Real-Time (Standard Sign Cadence)</option>
              <option value="1.25">1.25x — Fluent Speed (Advanced Comprehension)</option>
              <option value="1.5">1.5x — Rapid Review (Fast Drill Verification)</option>
            </select>
          </div>
        </div>

        {/* ================= 5. VIDEO OVERLAYS & SIGN SYSTEM ================= */}
        <div
          style={{
            background: '#242A27',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '32px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#E4EAE6', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🌐</span>
            <span>Dialect & Display Overlays</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Dialect */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#7CA992', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Primary Sign Language System
              </label>
              <select
                value={settings.dialect}
                onChange={(e) => setSettings({ ...settings, dialect: e.target.value })}
                style={{
                  width: '100%',
                  padding: '13px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#191C1A',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#E4EAE6',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ISL">Indian Sign Language (ISL - Standard Curriculum)</option>
                <option value="ASL">American Sign Language (ASL)</option>
                <option value="BSL">British Sign Language (BSL)</option>
              </select>
            </div>

            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />

            {/* Skeleton Overlay */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#E4EAE6' }}>Render 21 Landmark Joint Skeletons</div>
                <div style={{ fontSize: '12.5px', color: '#9CAEA4' }}>Draw real-time joint connections over the live video.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.skeletonOverlay}
                onChange={(e) => setSettings({ ...settings, skeletonOverlay: e.target.checked })}
                style={{ width: '22px', height: '22px', accentColor: '#7CA992', cursor: 'pointer' }}
              />
            </div>

            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />

            {/* Mirror Camera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#E4EAE6' }}>Mirror Video Feed Horizontally</div>
                <div style={{ fontSize: '12.5px', color: '#9CAEA4' }}>Flips webcam so left-right gestures match your natural mirror reflection.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.cameraMirror}
                onChange={(e) => setSettings({ ...settings, cameraMirror: e.target.checked })}
                style={{ width: '22px', height: '22px', accentColor: '#7CA992', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
          <Link
            to="/dashboard"
            style={{
              padding: '13px 24px',
              borderRadius: '12px',
              background: '#242A27',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#9CAEA4',
              fontSize: '14px',
              fontWeight: '700',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            Cancel
          </Link>

          <button
            onClick={handleSave}
            style={{
              padding: '13px 32px',
              borderRadius: '12px',
              background: '#7CA992',
              border: '1px solid #7CA992',
              color: '#191C1A',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>Save & Apply Settings</span>
            <span>➔</span>
          </button>
        </div>

      </div>
    </div>
  );
}
