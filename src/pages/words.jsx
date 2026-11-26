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

const PAGE_SIZE = 120;

export default function Words() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedWord, setSelectedWord] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveGloss, setLiveGloss] = useState('');
  const [liveFrame, setLiveFrame] = useState('');
  const iframeRef = useRef(null);

  const { allWords } = useMemo(() => getAllVocabulary(), []);

  useEffect(() => {
    if (!selectedWord && allWords.length > 0) {
      const defaultWord = allWords.find((w) => w.label.toLowerCase() === 'hello') || allWords[0];
      setSelectedWord(defaultWord);
    }
  }, [allWords, selectedWord]);

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

  const displayedWords = useMemo(() => {
    let list = allWords;

    if (selectedCategory !== 'all') {
      list = list.filter((w) => {
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
      list = list.filter((item) => (item.label || '').toLowerCase().includes(q));
    }

    return list;
  }, [allWords, selectedCategory, searchTerm]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, searchTerm]);

  const visibleWords = useMemo(() => displayedWords.slice(0, visibleCount), [displayedWords, visibleCount]);

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
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: '#191C1A',
        color: '#E4EAE6',
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
          backgroundColor: '#1F2421',
          overflowY: 'auto',
          overflowX: 'hidden',
          borderRight: '1px solid #2D3531',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
          <h1 style={{ color: '#E4EAE6', margin: 0, fontSize: '23px', fontWeight: '800' }}>
            Sign Dictionary &amp; Words
          </h1>
          <span style={{ fontSize: '12px', fontWeight: '700', backgroundColor: 'rgba(124,169,146,0.16)', color: '#A3CBB7', border: '1px solid rgba(124,169,146,0.3)', padding: '3px 10px', borderRadius: '10px' }}>
            {allWords.length}+ Words Ready
          </span>
        </div>
        <p style={{ color: '#B5C5BC', fontSize: '13.5px', marginBottom: '14px', lineHeight: '1.45' }}>
          Select any word to animate on the 3D avatar with live gloss and frame details.
        </p>

        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <label htmlFor="words-search-input" className="sr-only">
            Search sign dictionary words
          </label>
          <input
            id="words-search-input"
            type="search"
            placeholder="Search all words (e.g. Hello, Family, Apple, Friend)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 38px 12px 14px',
              borderRadius: '10px',
              border: '1px solid #3A443F',
              boxSizing: 'border-box',
              fontSize: '14px',
              backgroundColor: '#191C1A',
              color: '#E4EAE6'
            }}
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Clear search query"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#B5C5BC',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div
          role="group"
          aria-label="Filter vocabulary by category"
          style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px', flexShrink: 0 }}
        >
          {CATEGORIES.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                aria-pressed={isCatActive}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: isCatActive ? '1px solid #7CA992' : '1px solid #3A443F',
                  backgroundColor: isCatActive ? '#7CA992' : '#242A27',
                  color: isCatActive ? '#0D1310' : '#B5C5BC',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Word Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span role="status" aria-live="polite" style={{ fontSize: '12px', fontWeight: '700', color: '#A3CBB7' }}>
            SHOWING {displayedWords.length} SIGNS
          </span>
          <span style={{ fontSize: '11px', color: '#9CAEA4' }}>Click or use Arrow Keys &amp; Enter</span>
        </div>

        {/* Word Grid */}
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
          {visibleWords.length > 0 ? (
            <>
              {visibleWords.map((item, index) => {
                const isSelected = selectedWord && selectedWord.label.toLowerCase() === item.label.toLowerCase();
                return (
                  <button
                    type="button"
                    key={`${item.label}-${index}`}
                    aria-pressed={isSelected}
                    onClick={() => handleWordAction(item)}
                    onKeyDown={(e) => handleKeyDown(e, item)}
                    style={{
                      minHeight: '44px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      backgroundColor: isSelected ? '#7CA992' : '#242A27',
                      color: isSelected ? '#0D1310' : '#E4EAE6',
                      border: isSelected ? '1.5px solid #A3CBB7' : '1px solid #3A443F',
                      lineHeight: '1.25'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
              {displayedWords.length > visibleCount && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '12px 0' }}>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    style={{
                      backgroundColor: '#7CA992',
                      color: '#0D1310',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Load More Signs ({displayedWords.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 10px', color: '#B5C5BC' }}>
              <p style={{ margin: 0, fontSize: '15px' }}>No words match &quot;{searchTerm}&quot;.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                style={{
                  marginTop: '12px',
                  backgroundColor: '#242A27',
                  border: '1px solid #3A443F',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  color: '#E4EAE6'
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: 3D Avatar Viewer & Sage Gloss HUD */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#7CA992', textTransform: 'uppercase' }}>
              Active Word
            </span>
            <span style={{ backgroundColor: 'rgba(124,169,146,0.16)', color: '#A3CBB7', border: '1px solid rgba(124,169,146,0.35)', padding: '4px 12px', borderRadius: '8px', fontSize: '16px', fontWeight: '800' }}>
              {liveGloss || (selectedWord ? selectedWord.label : 'None')}
            </span>
            {selectedWord && (
              <span style={{ fontSize: '12px', color: '#9CAEA4' }}>
                {selectedWord.category} ({resolveSigmlPath(selectedWord.file)})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {liveFrame && (
              <span style={{ backgroundColor: '#242A27', padding: '4px 10px', borderRadius: '8px', color: '#A3CBB7', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #3A443F' }}>
                Frame: {liveFrame}
              </span>
            )}
            <button
              type="button"
              onClick={() => selectedWord && handleWordAction(selectedWord)}
              disabled={!selectedWord || isPlaying}
              style={{
                backgroundColor: '#7CA992',
                color: '#0D1310',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: !selectedWord || isPlaying ? 'not-allowed' : 'pointer',
                opacity: isPlaying ? 0.7 : 1
              }}
            >
              {isPlaying ? 'Signing...' : 'Replay Sign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
