import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { getAllVocabulary, playSiGMLFast, resolveSigmlPath } from '../utils/sigmlService';

const CATEGORIES = [
  { id: 'all', label: 'All Words' },
  { id: 'basics', label: 'Basics & Greetings' },
  { id: 'family', label: 'Family & Kinship' },
  { id: 'food', label: 'Food & Spices' },
  { id: 'adjectives', label: 'Adjectives & Feelings' },
  { id: 'animals', label: 'Animals & Nature' },
  { id: 'numbers', label: 'Numbers & Time' },
  { id: 'verbs', label: 'Actions & Verbs' }
];

export default function Words() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWord, setSelectedWord] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveGloss, setLiveGloss] = useState('');
  const [liveFrame, setLiveFrame] = useState('');
  const iframeRef = useRef(null);

  const { allWords } = useMemo(() => getAllVocabulary(), []);

  // Set default initial word
  useEffect(() => {
    if (!selectedWord && allWords.length > 0) {
      const defaultWord = allWords.find(w => w.label.toLowerCase() === 'hello') || allWords[0];
      setSelectedWord(defaultWord);
    }
  }, [allWords, selectedWord]);

  // Listen for real-time CWASA gloss and frame broadcasts from iframe
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

  // Filter words by category and search query
  const displayedWords = useMemo(() => {
    let list = allWords;

    if (selectedCategory !== 'all') {
      list = list.filter(w => {
        const cat = (w.category || '').toLowerCase();
        if (selectedCategory === 'basics') return cat.includes('basic') || cat.includes('general') || cat.includes('phrase');
        if (selectedCategory === 'family') return cat.includes('family');
        if (selectedCategory === 'food') return cat.includes('fruit') || cat.includes('vegetable') || cat.includes('dish');
        if (selectedCategory === 'adjectives') return cat.includes('adjective') || cat.includes('behaviour');
        if (selectedCategory === 'animals') return cat.includes('animal') || cat.includes('tree');
        if (selectedCategory === 'numbers') return cat.includes('number') || cat.includes('direction') || cat.includes('month') || cat.includes('weekday');
        if (selectedCategory === 'verbs') return cat.includes('verb');
        return true;
      });
    }

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(item => (item.label || '').toLowerCase().includes(q));
    }

    return list;
  }, [allWords, selectedCategory, searchTerm]);

  // Ultra-Fast Word Trigger (< 1ms)
  const handleWordAction = useCallback((item) => {
    if (!item) return;
    setSelectedWord(item);
    setLiveGloss(item.label);
    setIsPlaying(true);

    if (iframeRef.current) {
      playSiGMLFast(iframeRef.current, item.file);
    }

    setTimeout(() => {
      setIsPlaying(false);
    }, 1400);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e, item) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleWordAction(item);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.currentTarget.nextElementSibling?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.currentTarget.previousElementSibling?.focus();
    }
  };

  const handleIframeLoad = () => {
    if (selectedWord && iframeRef.current) {
      setTimeout(() => {
        handleWordAction(selectedWord);
      }, 600);
    }
  };

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
      {/* Left Panel: Search, Category Pills & Word List */}
      <div 
        className="signverse-panel-left"
        style={{
          width: '45%',
          height: '100%',
          padding: '24px 26px',
          backgroundColor: '#ffffff',
          overflowY: 'auto',
          overflowX: 'hidden',
          borderRight: '2px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h2 style={{ color: '#003366', margin: 0, fontSize: '24px', fontWeight: '800' }}>
            Sign Dictionary & Words
          </h2>
          <span style={{ fontSize: '12px', fontWeight: '700', backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: '12px' }}>
            {allWords.length}+ Words Ready
          </span>
        </div>
        <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '14px', lineHeight: '1.4' }}>
          Select any word to instantly animate on the 3D avatar with live gloss and frame details.
        </p>
        
        {/* Fast Search Input */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <input 
            type="text"
            placeholder="🔍 Search all words (e.g. Hello, Family, Apple, Friend)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 38px 12px 14px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              boxSizing: 'border-box',
              fontSize: '14.5px',
              outline: 'none',
              transition: 'border-color 0.2s',
              backgroundColor: '#f8fafc'
            }}
            onFocus={(e) => e.target.style.borderColor = '#003366'}
            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pill Filters */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '12px',
            scrollbarWidth: 'none'
          }}
        >
          {CATEGORIES.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: isCatActive ? '1px solid #003366' : '1px solid #e2e8f0',
                  backgroundColor: isCatActive ? '#003366' : '#ffffff',
                  color: isCatActive ? '#ffffff' : '#475569',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Word Counter Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
            SHOWING {displayedWords.length} SIGNS
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Click or use ↑ ↓ & Enter
          </span>
        </div>

        {/* Word Grid / List */}
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
            gap: '10px', 
            paddingRight: '6px' 
          }}
        >
          {displayedWords.length > 0 ? (
            displayedWords.map((item, index) => {
              const isSelected = selectedWord && selectedWord.label.toLowerCase() === item.label.toLowerCase();
              return (
                <div
                  key={`${item.label}-${index}`}
                  tabIndex={0} 
                  role="button"
                  onClick={() => handleWordAction(item)}
                  onKeyDown={(e) => handleKeyDown(e, item)}
                  style={{
                    minHeight: '44px',
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontSize: '15px', 
                    fontWeight: 'bold',
                    fontFamily: '"Times New Roman", Times, serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    backgroundColor: isSelected ? '#15803d' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#14532d',
                    border: isSelected ? '2px solid #166534' : '1.5px solid #cbd5e1',
                    transition: 'all 0.15s ease',
                    outline: 'none',
                    boxShadow: isSelected ? '0 4px 10px rgba(21, 128, 61, 0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
                    userSelect: 'none',
                    wordBreak: 'break-word',
                    lineHeight: '1.2'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#ecfdf5';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                  onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px #16a34a'}
                  onBlur={(e) => e.target.style.boxShadow = isSelected ? '0 4px 10px rgba(21, 128, 61, 0.3)' : 'none'}
                >
                  {item.label}
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
              <p style={{ margin: 0, fontSize: '15px' }}>No words match "{searchTerm}".</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                style={{ marginTop: '10px', backgroundColor: '#e2e8f0', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: '#334155' }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: 3D Avatar Viewer & Bottom Gloss HUD */}
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
        {/* Avatar Viewport Frame (Upper section) */}
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

        {/* Right Panel BOTTOM Gloss & Sign Details HUD (Green Theme with Times New Roman) */}
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
              {liveGloss || selectedWord?.label || 'HELLO'}
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

          {/* Details & Replay Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '6px', color: '#dcfce7', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              Category: <strong style={{ color: '#ffffff' }}>{selectedWord?.category || 'General'}</strong>
            </span>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '6px', color: '#86efac', fontFamily: 'monospace', fontSize: '12px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              {selectedWord ? resolveSigmlPath(selectedWord.file) : 'SignFiles/hello.sigml'}
            </span>
            {liveFrame && (
              <span style={{ backgroundColor: '#052e16', padding: '5px 10px', borderRadius: '6px', color: '#4ade80', fontFamily: 'monospace', fontWeight: 'bold', border: '1px solid #22c55e' }}>
                Frame: {liveFrame}
              </span>
            )}
            <button
              onClick={() => selectedWord && handleWordAction(selectedWord)}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: '1px solid #22c55e',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                fontFamily: '"Times New Roman", Times, serif',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.4)'
              }}
            >
              🔄 Replay
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}