import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import modulesData from '../modulesData.json';
import { updateStreak } from '../utils/streakManager';
import { playSiGMLFast, resolveSigmlPath, fetchAndCacheSiGML } from '../utils/sigmlService';

export default function Practice() {
  const iframeRef = useRef(null);

  const [practiceState, setPracticeState] = useState('setup');
  const [selectedTotal, setSelectedTotal] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [currentWord, setCurrentWord] = useState(null);
  const [nextWord, setNextWord] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [history, setHistory] = useState([]);
  const [liveGloss, setLiveGloss] = useState('');
  const [liveFrame, setLiveFrame] = useState('');

  const { allWords, categoryMap } = useMemo(() => {
    const list = [];
    const catMap = { all: [] };

    for (const category in modulesData) {
      if (Array.isArray(modulesData[category])) {
        const catKey = category.toLowerCase().trim();
        if (!catMap[catKey]) catMap[catKey] = [];

        modulesData[category].forEach((item) => {
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

  const activePool = useMemo(() => {
    const pool = categoryMap[selectedCategory] || allWords;
    return pool.length > 0 ? pool : allWords;
  }, [categoryMap, selectedCategory, allWords]);

  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('practiceHistory')) || [];
      setHistory(savedHistory);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin && e.origin !== window.location.origin) return;
      if (e.data && e.data.type === 'CWASA_GLOSS_UPDATE') {
        if (e.data.gloss) setLiveGloss(e.data.gloss);
        if (e.data.signFrame || e.data.frame) setLiveFrame(e.data.signFrame || e.data.frame);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const getRandomWord = (list) => list[Math.floor(Math.random() * list.length)];

  const playAnimation = useCallback((wordItem) => {
    if (!wordItem || !iframeRef.current) return;
    const resolved = resolveSigmlPath(wordItem.file);
    playSiGMLFast(iframeRef.current, resolved);
  }, []);

  const prepareCard = useCallback((wordToUse = null) => {
    setIsRevealed(false);
    const pool = activePool.length > 0 ? activePool : allWords;
    const card = wordToUse || getRandomWord(pool);
    setCurrentWord(card);
    playAnimation(card);

    const upcoming = getRandomWord(pool);
    setNextWord(upcoming);
    fetchAndCacheSiGML(resolveSigmlPath(upcoming.file)).catch(() => {});
  }, [activePool, allWords, playAnimation]);

  const startPractice = (totalCards) => {
    setSelectedTotal(totalCards);
    setSessionCorrect(0);
    setSessionTotal(0);
    setPracticeState('playing');
    prepareCard();
  };

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  const handleGameOver = (finalCorrect, finalTotal) => {
    setPracticeState('gameover');

    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: finalCorrect,
      total: finalTotal
    };

    setHistory((prev) => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('practiceHistory', JSON.stringify(updated));
      return updated;
    });
    updateStreak();
  };

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

  useEffect(() => {
    if (practiceState !== 'playing') return;

    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (!isRevealed) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleReveal();
        }
      } else if (e.key === '1' || e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleSelfEvaluation(true);
      } else if (e.key === '2' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleSelfEvaluation(false);
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
    setHistory([]);
    localStorage.removeItem('practiceHistory');
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
      {/* Left Panel */}
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
          boxSizing: 'border-box'
        }}
      >
        {practiceState === 'setup' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ color: '#E4EAE6', fontSize: '26px', marginBottom: '8px', fontWeight: '800' }}>
              Flashcard Practice
            </h1>
            <p style={{ color: '#B5C5BC', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              Watch the 3D sign, recall the word mentally, reveal the gloss, and honestly self-evaluate.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#A3CBB7', display: 'block', marginBottom: '8px', letterSpacing: '0.6px' }}>
                CHOOSE PRACTICE VOCABULARY
              </span>
              <div role="group" aria-label="Choose practice vocabulary" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Object.keys(categoryMap).slice(0, 8).map((cat) => {
                  const isSel = selectedCategory === cat;
                  return (
                    <button
                      type="button"
                      key={cat}
                      aria-pressed={isSel}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: isSel ? '1.5px solid #7CA992' : '1px solid #3A443F',
                        backgroundColor: isSel ? '#7CA992' : '#242A27',
                        color: isSel ? '#0D1310' : '#B5C5BC',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {cat} ({categoryMap[cat]?.length || 0})
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '22px' }}>
              {[5, 10, 15, 20, 30, 50].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => startPractice(num)}
                  style={{
                    padding: '16px 10px',
                    backgroundColor: '#242A27',
                    border: '1.5px solid #7CA992',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '800',
                    color: '#E4EAE6',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{num} Cards</span>
                  <span style={{ fontSize: '11px', color: '#A3CBB7', fontWeight: '600' }}>Self-Paced</span>
                </button>
              ))}
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setPracticeState('history')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: '1px solid #3A443F',
                  color: '#E4EAE6',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                View Practice History ({history.length} sessions)
              </button>
            )}
          </div>
        )}

        {practiceState === 'history' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: '#E4EAE6', margin: '0 0 16px 0', fontSize: '22px', fontWeight: '800' }}>
              Self-Evaluation History
            </h2>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #2D3531', borderRadius: '12px', padding: '12px', backgroundColor: '#191C1A', marginBottom: '16px' }}>
              {history.map((record) => (
                <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 6px', borderBottom: '1px solid #242A27', fontSize: '14px' }}>
                  <span style={{ color: '#9CAEA4' }}>{record.date}</span>
                  <span style={{ fontWeight: '800', color: record.score / record.total >= 0.7 ? '#7CA992' : '#FCD34D' }}>
                    Knew {record.score} of {record.total} ({Math.round((record.score / record.total) * 100)}%)
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={clearHistory}
                style={{ flex: 1, padding: '12px', backgroundColor: '#3B1E1E', color: '#FECACA', border: '1px solid #7F1D1D', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}
              >
                Clear History
              </button>
              <button
                type="button"
                onClick={() => setPracticeState('setup')}
                style={{ flex: 1, padding: '12px', backgroundColor: '#7CA992', color: '#0D1310', border: 'none', borderRadius: '10px', fontSize: '14.5px', fontWeight: '800', cursor: 'pointer' }}
              >
                Back to Setup
              </button>
            </div>
          </div>
        )}

        {practiceState === 'playing' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ color: '#E4EAE6', margin: 0, fontSize: '20px', fontWeight: '800' }}>Active Practice</h2>
              <div style={{ backgroundColor: 'rgba(124,169,146,0.16)', padding: '6px 14px', borderRadius: '10px', border: '1px solid rgba(124,169,146,0.35)' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#A3CBB7' }}>
                  Card {sessionTotal + 1} of {selectedTotal}
                </span>
              </div>
            </div>

            <p style={{ color: '#B5C5BC', fontSize: '13.5px', marginBottom: '16px' }}>
              Guess the sign in your mind, then press <kbd style={{ padding: '2px 6px', background: '#242A27', border: '1px solid #3A443F', borderRadius: '4px', fontWeight: '700', color: '#E4EAE6' }}>Space</kbd> to reveal.
            </p>

            <button
              type="button"
              onClick={() => playAnimation(currentWord)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#242A27',
                color: '#E4EAE6',
                border: '1px solid #3A443F',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>Replay Animation</span>
              <span style={{ fontSize: '11px', color: '#9CAEA4' }}>(Press R)</span>
            </button>

            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#191C1A',
                borderRadius: '14px',
                border: '1px dashed #3A443F',
                padding: '24px',
                textAlign: 'center'
              }}
            >
              {!isRevealed ? (
                <>
                  <div aria-hidden="true" style={{ fontSize: '36px', marginBottom: '10px' }}>🤟</div>
                  <h3 style={{ color: '#E4EAE6', margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800' }}>
                    What is the meaning of this sign?
                  </h3>
                  <p style={{ color: '#9CAEA4', fontSize: '13.5px', marginBottom: '22px' }}>
                    Formulate your answer mentally before revealing.
                  </p>
                  <button
                    type="button"
                    onClick={handleReveal}
                    autoFocus
                    style={{
                      padding: '13px 30px',
                      backgroundColor: '#7CA992',
                      color: '#0D1310',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15.5px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Show Answer (Space)
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <div
                    style={{
                      backgroundColor: '#242A27',
                      width: '100%',
                      padding: '18px',
                      borderRadius: '12px',
                      border: '1.5px solid #7CA992',
                      marginBottom: '20px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#7CA992', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                      SIGN MEANING / GLOSS
                    </span>
                    <div style={{ color: '#E4EAE6', margin: 0, fontSize: '30px', fontWeight: '900', textTransform: 'capitalize' }}>
                      {currentWord?.label}
                    </div>
                    <span style={{ fontSize: '12px', color: '#9CAEA4', marginTop: '4px', display: 'block' }}>
                      Category: {currentWord?.categoryName || 'General'}
                    </span>
                  </div>

                  <p style={{ color: '#E4EAE6', marginBottom: '12px', fontSize: '15px', fontWeight: '700' }}>
                    Did you recall it accurately?
                  </p>

                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => handleSelfEvaluation(true)}
                      autoFocus
                      style={{
                        flex: 1,
                        padding: '13px',
                        backgroundColor: '#7CA992',
                        color: '#0D1310',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14.5px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>Yes, I knew it!</span>
                      <span style={{ fontSize: '11px', opacity: 0.8 }}>(1 or Y)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelfEvaluation(false)}
                      style={{
                        flex: 1,
                        padding: '13px',
                        backgroundColor: '#3B1E1E',
                        color: '#FECACA',
                        border: '1px solid #7F1D1D',
                        borderRadius: '10px',
                        fontSize: '14.5px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>No, missed it</span>
                      <span style={{ fontSize: '11px', opacity: 0.85 }}>(2 or N)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {practiceState === 'gameover' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#242A27', borderRadius: '14px', border: '1px solid #3A443F', marginBottom: '20px' }}>
              <div aria-hidden="true" style={{ fontSize: '42px', marginBottom: '8px' }}>
                {sessionCorrect / selectedTotal >= 0.7 ? '🌟' : '📚'}
              </div>
              <h2 style={{ color: '#E4EAE6', margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800' }}>
                Practice Session Finished!
              </h2>
              <p style={{ fontSize: '15.5px', color: '#B5C5BC', margin: '0 0 12px 0' }}>
                You knew <strong style={{ color: '#7CA992', fontSize: '20px' }}>{sessionCorrect}</strong> out of {selectedTotal} signs ({Math.round((sessionCorrect / selectedTotal) * 100)}%).
              </p>
              <div style={{ display: 'inline-block', backgroundColor: 'rgba(124,169,146,0.16)', color: '#A3CBB7', border: '1px solid rgba(124,169,146,0.35)', padding: '4px 14px', borderRadius: '12px', fontSize: '12.5px', fontWeight: '700' }}>
                Recall Rate: {Math.round((sessionCorrect / selectedTotal) * 100)}%
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPracticeState('setup')}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: '#7CA992',
                color: '#0D1310',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15.5px',
                fontWeight: '800',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              Practice Another Batch
            </button>

            <h3 style={{ margin: '0 0 10px 0', color: '#B5C5BC', fontSize: '14.5px', fontWeight: '700' }}>Recent Practice Sessions</h3>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #2D3531', borderRadius: '10px', padding: '10px', backgroundColor: '#191C1A' }}>
              {history.slice(0, 6).map((record) => (
                <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #242A27', fontSize: '13.5px' }}>
                  <span style={{ color: '#9CAEA4' }}>{record.date}</span>
                  <span style={{ fontWeight: '800', color: '#7CA992' }}>
                    {record.score} / {record.total} Correct
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            onLoad={() => {
              if (practiceState === 'playing' && currentWord) {
                playAnimation(currentWord);
              }
            }}
          />
        </div>

        <div
          style={{
            position: 'relative',
            padding: '14px 20px',
            backgroundColor: '#141715',
            color: '#E4EAE6',
            borderTop: '1px solid #2D3531',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            minHeight: '64px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#7CA992', textTransform: 'uppercase' }}>
              Sign Gloss
            </span>
            <span
              style={{
                backgroundColor: 'rgba(124,169,146,0.16)',
                color: '#A3CBB7',
                border: '1px solid rgba(124,169,146,0.35)',
                padding: '4px 14px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '800'
              }}
            >
              {isRevealed || practiceState !== 'playing' ? (liveGloss || currentWord?.label?.toUpperCase() || 'READY') : 'HIDDEN'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
            {isRevealed && currentWord && (
              <span style={{ backgroundColor: '#242A27', padding: '5px 10px', borderRadius: '8px', color: '#A3CBB7', fontFamily: 'monospace', border: '1px solid #3A443F' }}>
                {resolveSigmlPath(currentWord.file)}
              </span>
            )}
            {liveFrame && (
              <span style={{ backgroundColor: '#242A27', padding: '5px 10px', borderRadius: '8px', color: '#A3CBB7', fontFamily: 'monospace', border: '1px solid #3A443F' }}>
                Frame: {liveFrame}
              </span>
            )}
          </div>

          {practiceState === 'playing' && !isRevealed && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: '#141715',
                borderTop: '1px solid #7CA992',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 25
              }}
            >
              <span style={{ color: '#A3CBB7', fontSize: '14px', fontWeight: '800', letterSpacing: '1px' }}>
                GLOSS HIDDEN — PRESS SPACE TO REVEAL
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
