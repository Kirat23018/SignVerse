import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * CWASA3DAvatar - 3D WebGL Sign Language Avatar Renderer
 * Communicates with the public/player-applet.html CWASA runtime via postMessage
 */
export default function CWASA3DAvatar({ sigml, title = '3D Sign Gesture', height = '360px' }) {
  const iframeRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [speed, setSpeed] = useState(1.0); // 1.0 = normal, 1.5 = slow

  const sendPlayCommand = useCallback((sigmlFile) => {
    if (!sigmlFile || !iframeRef.current || !iframeRef.current.contentWindow) return;
    setIsPlaying(true);

    try {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'PLAY_SIGML',
          payload: sigmlFile,
          file: sigmlFile,
          speed: speed
        },
        '*'
      );
    } catch (err) {
      console.warn('[CWASA3DAvatar] postMessage error:', err);
    }

    // Auto-reset playing animation status after gesture duration
    setTimeout(() => {
      setIsPlaying(false);
    }, 2400);
  }, [speed]);

  // When sigml prop changes and iframe is loaded, trigger playback
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
    if (sigml) {
      setTimeout(() => sendPlayCommand(sigml), 700);
    }
  };

  const handleReplay = () => {
    sendPlayCommand(sigml);
  };

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
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
          padding: '10px 16px',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isPlaying ? '#10b981' : '#64748b',
              boxShadow: isPlaying ? '0 0 10px #10b981' : 'none',
              transition: 'all 0.3s'
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', letterSpacing: '0.3px' }}>
            3D Avatar: Luna
          </span>
          {isPlaying && (
            <span
              style={{
                fontSize: '11px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: '600'
              }}
            >
              Signing...
            </span>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setSpeed(s => (s === 1.0 ? 1.5 : 1.0))}
            title="Toggle playback speed"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {speed === 1.5 ? '🐢 Slow (1.5x)' : '⚡ Normal (1.0x)'}
          </button>

          <button
            onClick={handleReplay}
            disabled={isPlaying}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: isPlaying ? 'not-allowed' : 'pointer',
              opacity: isPlaying ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background 0.2s'
            }}
          >
            <span>🔄</span>
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
          backgroundColor: '#e5e7eb'
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
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#0f172a',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: '#94a3b8'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(255, 255, 255, 0.1)',
                borderTopColor: '#38bdf8',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: '500' }}>Initializing 3D Avatar...</span>
          </div>
        )}
      </div>

      {/* Caption footer */}
      <div
        style={{
          padding: '8px 16px',
          backgroundColor: '#0b1329',
          color: '#64748b',
          fontSize: '11.5px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>💡 Click & drag the avatar to rotate 360° | Scroll to zoom</span>
        <span style={{ fontFamily: 'monospace', color: '#475569' }}>{sigml || 'none'}</span>
      </div>
    </div>
  );
}
