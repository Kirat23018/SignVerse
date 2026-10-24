import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import modulesData from '../modulesData.json';
import { updateStreak } from '../utils/streakManager';
import { playSiGMLFast, resolveSigmlPath, fetchAndCacheSiGML } from '../utils/sigmlService';

export default function Practice() {
  const iframeRef = useRef(null);

  // App States: 'setup' -> 'playing' -> 'gameover' -> 'history'
  const [practiceState, setPracticeState] = useState('setup');
  const [selectedTotal, setSelectedTotal] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [currentWord, setCurrentWord] = useState(null);
  const [nextWord, setNextWord] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  
  // Local session tracking
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [history, setHistory] = useState([]);
  const [liveGloss, setLiveGloss] = useState('');
  const [liveFrame, setLiveFrame] = useState('');

  // 1. Flatten the JSON data & categorize
  const { allWords, categoryMap } = useMemo(() => {
    const list = [];
    const catMap = { all: [] };

    for (const category in modulesData) {
      if (Array.isArray(modulesData[category])) {
        const catKey = category.toLowerCase().trim();
        if (!catMap[catKey]) catMap[catKey] = [];

        modulesData[category].forEach(item => {
          if (item.type !== 'video' && item.label && item.file) {
            const enriched = { ...item, categoryName: category };
            list.push(enriched);
            catMap[catKey].push(enriched);
            catMap.all.push(enriched);
          }
        });
      }
    }
    return { allWords: list, categoryMap: catMap };
  }, []);

  // Filtered pool
  const activePool = useMemo(() => {
    const pool = categoryMap[selectedCategory] || allWords;
    return pool.length > 0 ? pool : allWords;
  }, [categoryMap, selectedCategory, allWords]);

  // Load History
  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('practiceHistory')) || [];
      setHistory(savedHistory);
    } catch {
      setHistory([]);
    }
  }, []);

  // Listen to CWASA updates from iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'CWASA_GLOSS_UPDATE') {
        if (e.data.gloss) setLiveGloss(e.data.gloss);
        if (e.data.frame) setLiveFrame(e.data.frame);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const getRandomWord = (list) => list[Math.floor(Math.random() * list.length)];

  // Fast animation player via memory cache (< 1ms)
  const playAnimation = useCallback((wordItem) => {
    if (!wordItem || !iframeRef.current) return;
    const resolved = resolveSigmlPath(wordItem.file);
    playSiGMLFast(iframeRef.current, resolved);
  }, []);

  // Flashcard generator with prefetching of upcoming card
  const prepareCard = useCallback((wordToUse = null) => {
    setIsRevealed(false);
    const pool = activePool.length > 0 ? activePool : allWords;
    const card = wordToUse || getRandomWord(pool);
    setCurrentWord(card);

    // Play instantly
    playAnimation(card);

    // Prefetch the NEXT card's SiGML in memory cache
    const upcoming = getRandomWord(pool);
    setNextWord(upcoming);
    fetchAndCacheSiGML(resolveSigmlPath(upcoming.file)).catch(() => {});
  }, [activePool, allWords, playAnimation]);

  // Start Practice Session (Instantaneous, 0ms latency)
  const startPractice = (totalCards) => {
    setSelectedTotal(totalCards);
    setSessionCorrect(0);
    setSessionTotal(0);
    setPracticeState('playing');
    
    // Generate card immediately
    prepareCard();
  };

  // Handle Reveal (Instantaneous)
  const handleReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  // Handle Self Evaluation & Next Card Transition
  const handleSelfEvaluation = useCallback((isCorrect) => {
    const newCorrect = isCorrect ? sessionCorrect + 1 : sessionCorrect;
    const newTotal = sessionTotal + 1;

    if (isCorrect) setSessionCorrect(newCorrect);
    setSessionTotal(newTotal);

    if (newTotal >= selectedTotal) {
      handleGameOver(newCorrect, newTotal);
    } else {
      prepareCard(nextWord);
    }
  }, [sessionCorrect, sessionTotal, selectedTotal, nextWord, prepareCard]);

  // Game Over Logic
  const handleGameOver = (finalCorrect, finalTotal) => {
    setPracticeState('gameover');
    
    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: finalCorrect,
      total: finalTotal
    };
    
    setHistory(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('practiceHistory', JSON.stringify(updated));
      return updated;
    });
    updateStreak();
  };

  // Keyboard Shortcuts (Space to reveal, 1/Y for Yes, 2/N for No, R for Replay)
  useEffect(() => {
    if (practiceState !== 'playing') return;

    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (!isRevealed) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleReveal();
        }
      } else {
        if (e.key === '1' || e.key.toLowerCase() === 'y') {
          e.preventDefault();
          handleSelfEvaluation(true);
        } else if (e.key === '2' || e.key.toLowerCase() === 'n') {
          e.preventDefault();
          handleSelfEvaluation(false);
        }
      }

      if (e.key.toLowerCase() === 'r' && currentWord) {
        e.preventDefault();
        playAnimation(currentWord);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [practiceState, isRevealed, handleReveal, handleSelfEvaluation, currentWord, playAnimation]);

  const clearHistory = () => {
    if (window.confirm("Clear all practice history?")) {
      setHistory([]);
      localStorage.removeItem('practiceHistory');
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
      
      {/* Left Panel: Practice Interface */}
      <div 
        className="signverse-panel-left"
        style={{
          width: '45%',
          height: '100%',
          padding: '24px 28px',
          backgroundColor: '#ffffff',
          overflowY: 'auto',
          overflowX: 'hidden',
          borderRight: '2px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        
        {/* --- SETUP SCREEN --- */}
        {practiceState === 'setup' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ color: '#003366', fontSize: '28px', marginBottom: '8px', fontWeight: '800' }}>
              🎯 Flashcard Practice
            </h1>
            <p style={{ color: '#64748b', fontSize: '14.5px', marginBottom: '18px' }}>
              Practice at your own pace! Watch the sign, guess the word, reveal answer, and self-evaluate. Zero latency response.
            </p>

            {/* Category Filter Pills */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>
                CHOOSE PRACTICE VOCABULARY:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Object.keys(categoryMap).slice(0, 8).map(cat => {
                  const isSel = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: isSel ? '2px solid #16a34a' : '1px solid #cbd5e1',
                        backgroundColor: isSel ? '#16a34a' : '#f8fafc',
                        color: isSel ? '#ffffff' : '#334155',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat} ({categoryMap[cat]?.length || 0})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Count Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '22px' }}>
              {[5, 10, 15, 20, 30, 50].map(num => (
                <button
                  key={num}
                  onClick={() => startPractice(num)}
                  style={{
                    padding: '16px', backgroundColor: '#f8fafc', border: '2px solid #16a34a', 
                    borderRadius: '10px', fontSize: '16px', fontWeight: '800', color: '#15803d',
                    cursor: 'pointer', transition: 'all 0.15s ease', outline: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span>{num} Cards</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Self-Paced</span>
                </button>
              ))}
            </div>

            {history.length > 0 && (
              <button 
                onClick={() => setPracticeState('history')}
                style={{
                  width: '100%', padding: '12px', backgroundColor: 'transparent', border: '2px solid #003366',
                  color: '#003366', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f0f4f8'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                📜 View Practice History ({history.length} sessions)
              </button>
            )}
          </div>
        )}

        {/* --- HISTORY SCREEN --- */}
        {practiceState === 'history' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: '#003366', margin: '0 0 16px 0', fontSize: '24px', fontWeight: '800' }}>Self-Evaluation History</h2>
            
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', backgroundColor: '#fafafa', marginBottom: '16px' }}>
              {history.map((record) => (
                <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f1f5f9', fontSize: '14.5px' }}>
                  <span style={{ color: '#475569' }}>{record.date}</span>
                  <span style={{ fontWeight: '800', color: (record.score / record.total) >= 0.7 ? '#16a34a' : '#d97706' }}>
                    Knew {record.score} of {record.total} ({Math.round((record.score / record.total) * 100)}%)
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={clearHistory}
                style={{ flex: 1, padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
              >
                🗑️ Clear History
              </button>
              <button 
                onClick={() => setPracticeState('setup')}
                style={{ flex: 1, padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
              >
                🔙 Back to Setup
              </button>
            </div>
          </div>
        )}

        {/* --- PLAYING SCREEN --- */}
        {practiceState === 'playing' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ color: '#003366', margin: 0, fontSize: '20px', fontWeight: '800' }}>Active Practice</h2>
              <div style={{ backgroundColor: '#f0fdf4', padding: '6px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#166534' }}>
                  Card {sessionTotal + 1} of {selectedTotal}
                </span>
              </div>
            </div>
            
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
              Guess the sign in your mind. Then reveal the answer! Use <kbd style={{ padding: '2px 5px', background: '#e2e8f0', borderRadius: '4px', fontWeight: '700' }}>Space</kbd> to reveal.
            </p>

            <button 
              onClick={() => playAnimation(currentWord)}
              style={{ 
                width: '100%', padding: '10px', backgroundColor: '#f59e0b', color: 'white', 
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', 
                cursor: 'pointer', marginBottom: '20px', outline: 'none', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 2px 6px rgba(245,158,11,0.25)'
              }}
            >
              <span>🔄 Replay Animation</span>
              <span style={{ fontSize: '11px', opacity: 0.8 }}>(Press 'R')</span>
            </button>

            {/* Flashcard Box */}
            <div style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', 
              alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: '14px', 
              border: '2px dashed #cbd5e1', padding: '24px', textAlign: 'center' 
            }}>
              
              {!isRevealed ? (
                <>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤔</div>
                  <h3 style={{ color: '#334155', margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800' }}>
                    What is the meaning of this sign?
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '22px' }}>
                    Formulate your answer or fingerspell it in your mind first.
                  </p>
                  <button 
                    onClick={handleReveal}
                    autoFocus
                    style={{
                      padding: '14px 34px', backgroundColor: '#003366', color: 'white',
                      border: 'none', borderRadius: '30px', fontSize: '16px', fontWeight: '800',
                      cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center',
                      gap: '8px', boxShadow: '0 4px 12px rgba(0,51,102,0.25)'
                    }}
                  >
                    <span>👁️ Show Answer</span>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>(Space ↵)</span>
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <div style={{ 
                    backgroundColor: '#e0f2fe', width: '100%', padding: '18px', borderRadius: '10px', 
                    border: '2px solid #38bdf8', marginBottom: '20px', boxShadow: '0 2px 8px rgba(56,189,248,0.15)' 
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>
                      SIGN MEANING / GLOSS
                    </span>
                    <h1 style={{ color: '#003366', margin: 0, fontSize: '32px', letterSpacing: '0.5px', fontWeight: '900', textTransform: 'capitalize' }}>
                      {currentWord?.label}
                    </h1>
                    <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      Category: {currentWord?.categoryName || 'General'}
                    </span>
                  </div>

                  <h4 style={{ color: '#1e293b', marginBottom: '14px', fontSize: '15px', fontWeight: '700' }}>
                    Did you guess it right?
                  </h4>
                  
                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button 
                      onClick={() => handleSelfEvaluation(true)}
                      autoFocus
                      style={{
                        flex: 1, padding: '14px', backgroundColor: '#16a34a', color: 'white', 
                        border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', 
                        cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '2px', boxShadow: '0 2px 6px rgba(22,163,74,0.25)'
                      }}
                    >
                      <span>✅ Yes, I knew it!</span>
                      <span style={{ fontSize: '11px', opacity: 0.8 }}>(Press '1' or 'Y')</span>
                    </button>
                    <button 
                      onClick={() => handleSelfEvaluation(false)}
                      style={{
                        flex: 1, padding: '14px', backgroundColor: '#dc2626', color: 'white', 
                        border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '800', 
                        cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '2px', boxShadow: '0 2px 6px rgba(220,38,38,0.25)'
                      }}
                    >
                      <span>❌ No, missed it.</span>
                      <span style={{ fontSize: '11px', opacity: 0.8 }}>(Press '2' or 'N')</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* --- GAME OVER SCREEN --- */}
        {practiceState === 'gameover' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {sessionCorrect / selectedTotal >= 0.7 ? '🌟' : '📚'}
              </div>
              <h2 style={{ color: '#003366', margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800' }}>
                Practice Session Finished!
              </h2>
              <p style={{ fontSize: '16px', color: '#475569', margin: '0 0 12px 0' }}>
                You honestly knew <strong style={{ color: '#16a34a', fontSize: '22px' }}>{sessionCorrect}</strong> out of {selectedTotal} signs ({Math.round((sessionCorrect / selectedTotal) * 100)}%).
              </p>
              <div style={{ display: 'inline-block', backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '700' }}>
                Mastery Rate: {Math.round((sessionCorrect / selectedTotal) * 100)}%
              </div>
            </div>

            <button 
              onClick={() => setPracticeState('setup')}
              style={{
                width: '100%', padding: '14px', backgroundColor: '#16a34a', color: 'white',
                border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '800',
                cursor: 'pointer', marginBottom: '20px'
              }}
            >
              🔄 Practice Another Batch
            </button>

            <h3 style={{ margin: '0 0 10px 0', color: '#334155', fontSize: '15px', fontWeight: '700' }}>Recent Practice Sessions</h3>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', backgroundColor: '#fafafa' }}>
              {history.slice(0, 6).map((record) => (
                <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                  <span style={{ color: '#64748b' }}>{record.date}</span>
                  <span style={{ fontWeight: '800', color: '#16a34a' }}>
                    {record.score} / {record.total} Correct
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Avatar Viewer with Bottom Gloss HUD & Guess First Shield */}
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
        {/* Avatar Viewport Frame (Upper section taking full area) */}
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
            onLoad={() => {
              if (practiceState === 'playing' && currentWord) {
                playAnimation(currentWord);
              }
            }}
          />
        </div>

        {/* Right Panel BOTTOM Details & Gloss HUD (Green Theme with Times New Roman) */}
        <div
          style={{
            position: 'relative',
            padding: '14px 20px',
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
            fontFamily: '"Times New Roman", Times, serif',
            minHeight: '64px',
            boxSizing: 'border-box'
          }}
        >
          {/* Active Gloss Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#86efac', textTransform: 'uppercase', letterSpacing: '1px' }}>
              SIGN GLOSS:
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
              {isRevealed || practiceState !== 'playing' ? (liveGloss || currentWord?.label?.toUpperCase() || 'READY') : '???'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '6px', color: '#dcfce7', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              Mode: <strong style={{ color: '#ffffff' }}>Flashcard Practice</strong>
            </span>
            {isRevealed && currentWord && (
              <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '6px', color: '#86efac', fontFamily: 'monospace', fontSize: '12px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                {resolveSigmlPath(currentWord.file)}
              </span>
            )}
            {liveFrame && (
              <span style={{ backgroundColor: '#052e16', padding: '5px 10px', borderRadius: '6px', color: '#4ade80', fontFamily: 'monospace', fontWeight: 'bold', border: '1px solid #22c55e' }}>
                Frame: {liveFrame}
              </span>
            )}
          </div>

          {/* GUESS FIRST Box Overlay - hides the details while card is unrevealed */}
          {practiceState === 'playing' && !isRevealed && (
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#052e16',
              borderTop: '3px solid #22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 25,
              boxShadow: '0 -4px 14px rgba(0,0,0,0.3)'
            }}>
              <div style={{
                backgroundColor: '#14532d',
                border: '2px solid #22c55e',
                padding: '8px 28px',
                borderRadius: '8px',
                color: '#4ade80',
                fontSize: '17px',
                fontWeight: 'bold',
                letterSpacing: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: '"Times New Roman", Times, serif',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}>
                <span>🤔 GUESS FIRST! (Press Space to Reveal)</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}