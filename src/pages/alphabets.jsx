import React, { useState, useRef, useEffect, useCallback } from 'react';

// Static alphabet datasets defined outside component so they are never reallocated
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

// In-memory cache for fetched & sanitized SiGML XML text to ensure 0ms playback latency
const sigmlCache = new Map();

// Helper to sanitize SiGML text (strip BOM, XML declarations, rogue comments)
function cleanSiGML(rawText) {
  if (!rawText) return '';
  let clean = rawText.trim();
  if (clean.charCodeAt(0) === 0xFEFF) {
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

// Fetch and cache SiGML text in memory
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
  } catch (err) {
    console.warn(`[Alphabets] SiGML fetch failed for ${path}:`, err);
    return null;
  }
}

export default function Alphabets() {
  const [handMode, setHandMode] = useState('double'); // 'double' | 'single'
  const alphabetList = handMode === 'double' ? DOUBLE_HANDED_LIST : SINGLE_HANDED_LIST;
  const [activeItem, setActiveItem] = useState(alphabetList[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveGloss, setLiveGloss] = useState('');
  const [liveFrame, setLiveFrame] = useState('');
  const iframeRef = useRef(null);
  const isIframeReady = useRef(false);

  // Listen for real-time CWASA gloss and frame broadcasts
  useEffect(() => {
    const handleMsg = (e) => {
      if (e.data && e.data.type === 'CWASA_GLOSS_UPDATE') {
        if (e.data.gloss) setLiveGloss(e.data.gloss);
        if (e.data.signFrame) setLiveFrame(e.data.signFrame);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  // Play animation using cached text (fastest) or fallback to URL
  const playItem = useCallback(async (item) => {
    if (!item) return;
    setIsPlaying(true);
    const path = item.file;

    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    // Check if already in memory cache
    let text = sigmlCache.get(path);
    if (!text) {
      text = await fetchSiGML(path);
    }

    if (iframe.contentWindow) {
      if (text) {
        // Direct in-memory text playback - zero network round-trip!
        try {
          if (typeof iframe.contentWindow.playText === 'function') {
            iframe.contentWindow.playText(text);
          } else {
            iframe.contentWindow.postMessage({ type: 'PLAY_TEXT', text }, '*');
          }
        } catch {
          iframe.contentWindow.postMessage({ type: 'PLAY_TEXT', text }, '*');
        }
      } else {
        // Fallback to URL if fetch failed
        try {
          if (typeof iframe.contentWindow.startPlayer === 'function') {
            iframe.contentWindow.startPlayer(path);
          } else {
            iframe.contentWindow.postMessage({ type: 'PLAY_SIGML', file: path }, '*');
          }
        } catch {
          iframe.contentWindow.postMessage({ type: 'PLAY_SIGML', file: path }, '*');
        }
      }
    }

    // Reset playing indicator after animation completes
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
    const nextItem = list.find(x => x.label.toUpperCase() === currentLetter.toUpperCase()) || list[0];
    setActiveItem(nextItem);
    playItem(nextItem);
  }, [activeItem, playItem]);

  // Initial playback once iframe signals ready or loads
  const handleIframeLoad = useCallback(() => {
    isIframeReady.current = true;
    if (activeItem) {
      // Delay slightly for CWASA engine init inside iframe
      setTimeout(() => {
        playItem(activeItem);
      }, 700);
    }
  }, [activeItem, playItem]);

  // Background idle pre-fetching of alphabet SiGML files
  useEffect(() => {
    let isCancelled = false;
    const prefetchList = async () => {
      for (const item of alphabetList) {
        if (isCancelled) break;
        if (!sigmlCache.has(item.file)) {
          await fetchSiGML(item.file);
          // Yield thread briefly between fetches
          await new Promise(r => setTimeout(r, 60));
        }
      }
    };

    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(() => prefetchList(), { timeout: 2000 });
      return () => {
        isCancelled = true;
        window.cancelIdleCallback(handle);
      };
    } else {
      const timer = setTimeout(prefetchList, 1000);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  }, [alphabetList]);

  // Global "Type-to-Sign" Keyboard Shortcut (press any letter A-Z to trigger immediately)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      const char = e.key.toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        e.preventDefault();
        const found = alphabetList.find(x => x.label === char);
        if (found) {
          selectAlphabet(found);
        }
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
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f8fafc',
        position: 'relative'
      }}
    >
      {/* Left Panel: Grid of Alphabets */}
      <div
        className="signverse-panel-left"
        style={{
          width: '45%',
          height: '100%',
          padding: '26px 30px',
          backgroundColor: '#ffffff',
          overflowY: 'auto',
          overflowX: 'hidden',
          borderRight: '2px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h2 style={{ color: '#003366', margin: 0, fontSize: '24px', fontWeight: '800' }}>
              Learn Sign Alphabets (A-Z)
            </h2>
            <span style={{ fontSize: '12px', fontWeight: '600', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '12px' }}>
              ⚡ Fast Mode
            </span>
          </div>

          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '14px', textAlign: 'left', lineHeight: '1.4' }}>
            Click any alphabet or simply <strong>press any key (A–Z) on your keyboard</strong> to watch its 3D animation instantly.
          </p>

          {/* Hand Mode Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => handleModeChange('double')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                border: handMode === 'double' ? '2px solid #003366' : '1px solid #cbd5e1',
                backgroundColor: handMode === 'double' ? '#003366' : '#ffffff',
                color: handMode === 'double' ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: handMode === 'double' ? '0 2px 6px rgba(0,51,102,0.2)' : 'none'
              }}
            >
              🤲 Double Handed (ISL)
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('single')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                border: handMode === 'single' ? '2px solid #003366' : '1px solid #cbd5e1',
                backgroundColor: handMode === 'single' ? '#003366' : '#ffffff',
                color: handMode === 'single' ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: handMode === 'single' ? '0 2px 6px rgba(0,51,102,0.2)' : 'none'
              }}
            >
              ✋ Single Handed
            </button>
          </div>

          {/* Responsive Alphabet Grid */}
          <div className="signverse-alpha-grid">
            {alphabetList.map((item) => {
              const isSelected = activeItem && activeItem.label === item.label;
              return (
                <div
                  key={item.label}
                  tabIndex={0}
                  role="button"
                  aria-label={`Letter ${item.label}`}
                  onClick={() => selectAlphabet(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectAlphabet(item);
                    }
                  }}
                  style={{
                    padding: '14px 0',
                    fontSize: '18px',
                    fontWeight: '800',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #4d7c0f' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#689f38' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#1e293b',
                    textAlign: 'center',
                    boxShadow: isSelected ? '0 4px 10px rgba(104,159,56,0.35)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.12s ease',
                    outline: 'none',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px #003366'}
                  onBlur={(e) => e.target.style.boxShadow = isSelected ? '0 4px 10px rgba(104,159,56,0.35)' : '0 1px 3px rgba(0,0,0,0.04)'}
                >
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ paddingTop: '14px' }}>
          <button
            type="button"
            tabIndex={0}
            onClick={() => playItem(activeItem)}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: isPlaying ? '#4d7c0f' : '#689f38',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '800',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.15s ease',
              boxShadow: '0 4px 12px rgba(104,159,56,0.3)'
            }}
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 3px #003366'}
            onBlur={(e) => e.target.style.boxShadow = '0 4px 12px rgba(104,159,56,0.3)'}
          >
            ▶ Replay Animation ({activeItem ? activeItem.label : 'A'})
          </button>
        </div>
      </div>

      {/* Right Panel: Avatar Viewer with Bottom Gloss & Details HUD */}
      <div
        className="signverse-panel-right"
        style={{
          width: '55%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#e5e7eb',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Avatar Viewport Frame (Takes full upper area) */}
        <div
          className="signverse-avatar-frame"
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#e5e7eb'
          }}
        >
          <iframe
            ref={iframeRef}
            src="/player-applet.html"
            title="CWASA Avatar Player"
            className="signverse-avatar-iframe"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block'
            }}
            onLoad={handleIframeLoad}
          />
        </div>

        {/* Right Panel BOTTOM Details & Gloss HUD (Green Theme with Times New Roman) */}
        <div
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(180deg, #052e16 0%, #14532d 100%)',
            color: '#ffffff',
            borderTop: '3px solid #22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            zIndex: 10,
            boxShadow: '0 -4px 14px rgba(0,0,0,0.25)',
            fontFamily: '"Times New Roman", Times, serif'
          }}
        >
          {/* Active Gloss Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#86efac', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ACTIVE GLOSS:
            </span>
            <span
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.25)',
                color: '#4ade80',
                border: '1.5px solid #22c55e',
                padding: '4px 16px',
                borderRadius: '8px',
                fontSize: '20px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              {liveGloss || activeItem?.label || 'A'}
            </span>
            <span
              style={{
                fontSize: '12px',
                backgroundColor: isPlaying ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                color: isPlaying ? '#4ade80' : '#bbf7d0',
                border: isPlaying ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.2)',
                padding: '4px 10px',
                borderRadius: '12px',
                fontWeight: 'bold'
              }}
            >
              {isPlaying ? '🟢 Signing...' : '⚪ Ready'}
            </span>
          </div>

          {/* Details Pill Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '6px', color: '#dcfce7', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              Mode: <strong style={{ color: '#ffffff' }}>{handMode === 'double' ? 'ISL Double Hand' : 'Single Hand'}</strong>
            </span>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '6px', color: '#86efac', fontFamily: 'monospace', fontSize: '12px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              {activeItem?.file}
            </span>
            {liveFrame && (
              <span style={{ backgroundColor: '#052e16', padding: '5px 10px', borderRadius: '6px', color: '#4ade80', fontFamily: 'monospace', fontWeight: 'bold', border: '1px solid #22c55e' }}>
                Frame: {liveFrame}
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}