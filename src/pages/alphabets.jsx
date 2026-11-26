import React, { useState, useRef, useEffect, useCallback } from 'react';

const DOUBLE_HANDED_LIST = Object.freeze(
  Array.from({ length: 26 }, (_, i) => {
    const letter = String.fromCharCode(65 + i);
    return { label: letter, file: `SignFiles/${letter}.sigml` };
  })
);

const SINGLE_HANDED_LIST = Object.freeze(
  Array.from({ length: 26 }, (_, i) => {
    const letter = String.fromCharCode(65 + i);
    return { label: letter, file: `DictionarySigns/alphabets_single_handed/${letter.toLowerCase()}.sigml` };
  })
);

const sigmlCache = new Map();

function cleanSiGML(rawText) {
  if (!rawText) return '';
  let clean = rawText.trim();
  if (clean.charCodeAt(0) === 0xfeff) {
    clean = clean.slice(1);
  }
  const sigmlStart = clean.indexOf('<sigml');
  if (sigmlStart !== -1) {
    clean = clean.substring(sigmlStart);
  }
  const sigmlEnd = clean.lastIndexOf('</sigml>');
  if (sigmlEnd !== -1) {
    clean = clean.substring(0, sigmlEnd + 8);
  }
  return clean.replace(/<sigml>\s*-->/gi, '<sigml>');
}

async function fetchSiGML(path) {
  if (sigmlCache.has(path)) {
    return sigmlCache.get(path);
  }
  try {
    const res = await fetch(`/${path.startsWith('/') ? path.slice(1) : path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const sanitized = cleanSiGML(text);
    if (sanitized) {
      sigmlCache.set(path, sanitized);
    }
    return sanitized;
  } catch {
    return null;
  }
}

export default function Alphabets() {
  const [handMode, setHandMode] = useState('double');
  const alphabetList = handMode === 'double' ? DOUBLE_HANDED_LIST : SINGLE_HANDED_LIST;
  const [activeItem, setActiveItem] = useState(alphabetList[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveGloss, setLiveGloss] = useState('');
  const [liveFrame, setLiveFrame] = useState('');
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMsg = (e) => {
      if (e.origin && e.origin !== window.location.origin) return;
      if (e.data && e.data.type === 'CWASA_GLOSS_UPDATE') {
        if (e.data.gloss) setLiveGloss(e.data.gloss);
        if (e.data.signFrame) setLiveFrame(e.data.signFrame);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const playItem = useCallback(async (item) => {
    if (!item) return;
    setIsPlaying(true);
    const path = item.file;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) {
      setIsPlaying(false);
      return;
    }

    const targetOrigin = window.location.origin;
    let text = sigmlCache.get(path);
    if (!text) {
      text = await fetchSiGML(path);
    }

    if (iframe.contentWindow) {
      if (text) {
        try {
          if (typeof iframe.contentWindow.playText === 'function') {
            iframe.contentWindow.playText(text);
          } else {
            iframe.contentWindow.postMessage({ type: 'PLAY_TEXT', text }, targetOrigin);
          }
        } catch {
          iframe.contentWindow.postMessage({ type: 'PLAY_TEXT', text }, targetOrigin);
        }
      } else {
        try {
          if (typeof iframe.contentWindow.startPlayer === 'function') {
            iframe.contentWindow.startPlayer(path);
          } else {
            iframe.contentWindow.postMessage({ type: 'PLAY_SIGML', file: path }, targetOrigin);
          }
        } catch {
          iframe.contentWindow.postMessage({ type: 'PLAY_SIGML', file: path }, targetOrigin);
        }
      }
    }

    setTimeout(() => setIsPlaying(false), 1200);
  }, []);

  const selectAlphabet = useCallback((item) => {
    setActiveItem(item);
    playItem(item);
  }, [playItem]);

  const handleModeChange = useCallback((newMode) => {
    setHandMode(newMode);
    const list = newMode === 'double' ? DOUBLE_HANDED_LIST : SINGLE_HANDED_LIST;
    const currentLetter = activeItem ? activeItem.label : 'A';
    const nextItem = list.find((x) => x.label.toUpperCase() === currentLetter.toUpperCase()) || list[0];
    setActiveItem(nextItem);
    playItem(nextItem);
  }, [activeItem, playItem]);

  const handleIframeLoad = useCallback(() => {
    if (activeItem) {
      setTimeout(() => playItem(activeItem), 700);
    }
  }, [activeItem, playItem]);

  useEffect(() => {
    let isCancelled = false;
    const prefetchList = async () => {
      for (const item of alphabetList) {
        if (isCancelled) break;
        if (!sigmlCache.has(item.file)) {
          await fetchSiGML(item.file);
          await new Promise((r) => setTimeout(r, 60));
        }
      }
    };

    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(() => prefetchList(), { timeout: 2000 });
      return () => {
        isCancelled = true;
        window.cancelIdleCallback(handle);
      };
    }
    const timer = setTimeout(prefetchList, 1000);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [alphabetList]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const char = e.key.toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        e.preventDefault();
        const found = alphabetList.find((x) => x.label === char);
        if (found) selectAlphabet(found);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [alphabetList, selectAlphabet]);

  return (
    <div
      className="signverse-split-container"
      style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: '#191C1A',
        color: '#E4EAE6',
        position: 'relative'
      }}
    >
      {/* Left Panel: Grid of Alphabets */}
      <div
        className="signverse-panel-left"
        style={{
          width: '45%',
          height: '100%',
          padding: '24px 28px',
          backgroundColor: '#1F2421',
          overflowY: 'auto',
          overflowX: 'hidden',
          borderRight: '1px solid #2D3531',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ color: '#E4EAE6', margin: 0, fontSize: '23px', fontWeight: '800' }}>
              Learn Sign Alphabets (A-Z)
            </h1>
            <span style={{ fontSize: '12px', fontWeight: '700', backgroundColor: 'rgba(124,169,146,0.16)', color: '#A3CBB7', border: '1px solid rgba(124,169,146,0.3)', padding: '3px 10px', borderRadius: '10px' }}>
              26 Letters Ready
            </span>
          </div>

          <p style={{ color: '#B5C5BC', fontSize: '13.5px', marginBottom: '14px', lineHeight: '1.45' }}>
            Click any letter or press any key (<strong style={{ color: '#E4EAE6' }}>A–Z</strong>) on your keyboard to play its 3D animation.
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
            <button
              type="button"
              aria-pressed={handMode === 'double'}
              onClick={() => handleModeChange('double')}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: '700',
                border: handMode === 'double' ? '1.5px solid #7CA992' : '1px solid #3A443F',
                backgroundColor: handMode === 'double' ? '#7CA992' : '#242A27',
                color: handMode === 'double' ? '#0D1310' : '#B5C5BC',
                cursor: 'pointer'
              }}
            >
              Double Handed (ISL)
            </button>
            <button
              type="button"
              aria-pressed={handMode === 'single'}
              onClick={() => handleModeChange('single')}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: '700',
                border: handMode === 'single' ? '1.5px solid #7CA992' : '1px solid #3A443F',
                backgroundColor: handMode === 'single' ? '#7CA992' : '#242A27',
                color: handMode === 'single' ? '#0D1310' : '#B5C5BC',
                cursor: 'pointer'
              }}
            >
              Single Handed
            </button>
          </div>

          <div className="signverse-alpha-grid" role="group" aria-label="Alphabet signs A to Z">
            {alphabetList.map((item) => {
              const isSelected = activeItem && activeItem.label === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-label={`Letter ${item.label}`}
                  aria-pressed={isSelected}
                  onClick={() => selectAlphabet(item)}
                  style={{
                    padding: '13px 0',
                    fontSize: '18px',
                    fontWeight: '800',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid #A3CBB7' : '1px solid #3A443F',
                    backgroundColor: isSelected ? '#7CA992' : '#242A27',
                    color: isSelected ? '#0D1310' : '#E4EAE6',
                    textAlign: 'center'
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ paddingTop: '14px' }}>
          <button
            type="button"
            onClick={() => playItem(activeItem)}
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: '#7CA992',
              color: '#0D1310',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            {isPlaying ? 'Playing Animation...' : `Replay Animation (${activeItem ? activeItem.label : 'A'})`}
          </button>
        </div>
      </div>

      {/* Right Panel: 3D Avatar Viewer */}
      <div
        className="signverse-panel-right"
        style={{
          width: '55%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#191C1A',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          className="signverse-avatar-frame"
          style={{ flex: 1, width: '100%', height: '100%', position: 'relative', backgroundColor: '#191C1A' }}
        >
          <iframe
            ref={iframeRef}
            src="/player-applet.html"
            title="CWASA Avatar Player"
            onLoad={handleIframeLoad}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>

        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#141715',
            color: '#E4EAE6',
            borderTop: '1px solid #2D3531',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#7CA992', textTransform: 'uppercase' }}>
              Active Letter
            </span>
            <span style={{ backgroundColor: 'rgba(124,169,146,0.16)', color: '#A3CBB7', border: '1px solid rgba(124,169,146,0.35)', padding: '4px 12px', borderRadius: '8px', fontSize: '16px', fontWeight: '800' }}>
              {liveGloss || (activeItem ? activeItem.label : 'A')}
            </span>
            <span style={{ fontSize: '12px', color: '#9CAEA4' }}>
              Mode: {handMode === 'double' ? 'Double Handed (ISL)' : 'Single Handed'}
            </span>
          </div>

          {liveFrame && (
            <span style={{ backgroundColor: '#242A27', padding: '4px 10px', borderRadius: '8px', color: '#A3CBB7', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #3A443F' }}>
              Frame: {liveFrame}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
