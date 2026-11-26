import React, { useRef, useEffect, useState, useCallback } from 'react';
import { resolveSigmlPath, stopSiGML } from '../utils/sigmlService';

const AVATARS = [
  { id: 'luna', label: 'Luna' },
  { id: 'marc', label: 'Marc' },
  { id: 'anna', label: 'Anna' },
  { id: 'francoise', label: 'Francoise' },
  { id: 'siggi', label: 'Siggi' }
];

const VALID_AVATAR_IDS = new Set(AVATARS.map((a) => a.id));

function readStoredAvatarPreferences() {
  try {
    const raw = JSON.parse(localStorage.getItem('signverse_user_settings') || 'null');
    const avatar = VALID_AVATAR_IDS.has(raw?.defaultAvatar) ? raw.defaultAvatar : 'luna';
    const rawSpeed = parseFloat(raw?.avatarSpeed);
    const speed = rawSpeed >= 1.25 ? 1.5 : 1.0;
    return { avatar, speed };
  } catch {
    return { avatar: 'luna', speed: 1.0 };
  }
}

/**
 * CWASA3DAvatar - 3D WebGL Sign Language Avatar Renderer
 * Communicates with public/player-applet.html CWASA runtime via same-origin postMessage
 */
export default function CWASA3DAvatar({ sigml, title = '3D Sign Gesture', height = '360px' }) {
  const initialPrefs = readStoredAvatarPreferences();
  const iframeRef = useRef(null);
  const timerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [speed, setSpeed] = useState(initialPrefs.speed); // 1.0 = normal, 1.5 = slow
  const [avatar, setAvatar] = useState(initialPrefs.avatar);
  const [runtimeNotice, setRuntimeNotice] = useState(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'CWASA_STATUS') {
        if (event.data.status === 'error' || event.data.status === 'warning') {
          setRuntimeNotice({
            level: event.data.status,
            message: event.data.message || '3D Avatar playback issue.'
          });
          setIsPlaying(false);
        } else if (event.data.status === 'ready') {
          setRuntimeNotice(null);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const sendPlayCommand = useCallback((sigmlFile) => {
    const safePath = resolveSigmlPath(sigmlFile);
    if (!safePath || !iframeRef.current || !iframeRef.current.contentWindow) return;
    setRuntimeNotice(null);
    setIsPlaying(true);

    const targetOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '*';
    try {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'PLAY_SIGML',
          payload: safePath,
          file: safePath,
          speed
        },
        targetOrigin
      );
    } catch {
      // Safe non-fatal postMessage fallback
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsPlaying(false);
    }, 2400);
  }, [speed]);

  useEffect(() => {
    if (isIframeLoaded && sigml) {
      const timer = setTimeout(() => {
        sendPlayCommand(sigml);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sigml, isIframeLoaded, sendPlayCommand]);

  const handleIframeLoad = () => {
    setIsIframeLoaded(true);
    if (avatar && avatar !== 'luna' && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          { type: 'SET_AVATAR', avatar },
          window.location.origin
        );
      } catch {
        // Non-fatal
      }
    }
    if (sigml) {
      setTimeout(() => sendPlayCommand(sigml), 700);
    }
  };

  const handleAvatarChange = (nextAvatar) => {
    setAvatar(nextAvatar);
    if (!iframeRef.current?.contentWindow) return;
    const targetOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '*';
    try {
      iframeRef.current.contentWindow.postMessage(
        { type: 'SET_AVATAR', avatar: nextAvatar },
        targetOrigin
      );
    } catch {
      // Non-fatal
    }
  };

  const handleReplay = () => {
    sendPlayCommand(sigml);
  };

  const handleStop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stopSiGML(iframeRef.current);
    setIsPlaying(false);
  };

  const selectedAvatarLabel = AVATARS.find((a) => a.id === avatar)?.label || 'Luna';

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#191C1A',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #2D3531',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '10px 14px',
          backgroundColor: '#242A27',
          borderBottom: '1px solid #3A443F'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            aria-hidden="true"
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isPlaying ? '#7CA992' : '#85968C',
              boxShadow: isPlaying ? '0 0 10px rgba(124,169,146,0.8)' : 'none',
              transition: 'all 0.3s'
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#E4EAE6', letterSpacing: '0.2px' }}>
            3D Avatar: {selectedAvatarLabel}
          </span>
          <span role="status" aria-live="polite">
            {isPlaying && (
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(124, 169, 146, 0.18)',
                  color: '#A3CBB7',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: '700'
                }}
              >
                Signing...
              </span>
            )}
          </span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <label htmlFor="cwasa-avatar-select" className="sr-only">
            Select 3D Sign Avatar
          </label>
          <select
            id="cwasa-avatar-select"
            value={avatar}
            onChange={(e) => handleAvatarChange(e.target.value)}
            aria-label="Select 3D Avatar character"
            style={{
              backgroundColor: '#191C1A',
              color: '#E4EAE6',
              border: '1px solid #3A443F',
              padding: '4px 8px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {AVATARS.map((av) => (
              <option key={av.id} value={av.id}>
                {av.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setSpeed((s) => (s === 1.0 ? 1.5 : 1.0))}
            aria-label={`Toggle playback speed, currently ${speed === 1.5 ? 'slow 1.5x' : 'normal 1.0x'}`}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#E4EAE6',
              border: '1px solid #3A443F',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {speed === 1.5 ? 'Slow (1.5x)' : 'Normal (1.0x)'}
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={handleStop}
              aria-label={`Stop ${title} sign animation`}
              style={{
                backgroundColor: '#3A2323',
                color: '#FECACA',
                border: '1px solid #7F1D1D',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Stop
            </button>
          )}

          <button
            type="button"
            onClick={handleReplay}
            disabled={isPlaying}
            aria-label={`Replay ${title} sign animation`}
            style={{
              backgroundColor: '#7CA992',
              color: '#0D1310',
              border: 'none',
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: isPlaying ? 'not-allowed' : 'pointer',
              opacity: isPlaying ? 0.65 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'opacity 0.2s'
            }}
          >
            <span>Replay Sign</span>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas iframe Viewport */}
      <div
        style={{
          width: '100%',
          height: height,
          position: 'relative',
          backgroundColor: '#191C1A'
        }}
      >
        <iframe
          ref={iframeRef}
          src="/player-applet.html"
          title={title}
          onLoad={handleIframeLoad}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
        />

        {/* Loading overlay while iframe initializes */}
        {!isIframeLoaded && (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#191C1A',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: '#E4EAE6'
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(124, 169, 146, 0.2)',
                borderTopColor: '#7CA992',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: '500' }}>Initializing 3D Avatar...</span>
          </div>
        )}

        {/* Runtime error/offline banner */}
        {runtimeNotice && (
          <div
            role="alert"
            style={{
              position: 'absolute',
              left: '12px',
              right: '12px',
              bottom: '12px',
              backgroundColor: 'rgba(25, 28, 26, 0.94)',
              border: `1px solid ${runtimeNotice.level === 'error' ? '#EF4444' : '#F59E0B'}`,
              borderRadius: '10px',
              padding: '10px 12px',
              color: '#E4EAE6',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>{runtimeNotice.message}</span>
            <button
              type="button"
              onClick={handleReplay}
              style={{
                backgroundColor: '#242A27',
                color: '#E4EAE6',
                border: '1px solid #3A443F',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Caption footer */}
      <div
        style={{
          padding: '8px 14px',
          backgroundColor: '#141715',
          color: '#B5C5BC',
          fontSize: '11.5px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #2D3531'
        }}
      >
        <span>Click &amp; drag avatar to rotate 360° • Scroll to zoom</span>
      </div>
    </div>
  );
}
