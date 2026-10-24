import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import modulesData from '../modulesData.json';
import { updateStreak } from '../utils/streakManager';
import { playSiGMLFast, resolveSigmlPath, fetchAndCacheSiGML } from '../utils/sigmlService';

export default function Quiz() {
  const iframeRef = useRef(null);
  const scoreRef = useRef(0);

  // App States: 'setup' -> 'playing' -> 'gameover' -> 'history'
  const [quizState, setQuizState] = useState('setup'); 
  const [selectedTotal, setSelectedTotal] = useState(10); 
  const [timeLeft, setTimeLeft] = useState(60); 
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [currentWord, setCurrentWord] = useState(null);
  const [nextWord, setNextWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hasGuessed, setHasGuessed] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [history, setHistory] = useState([]);
  const [liveGloss, setLiveGloss] = useState('');
  const [liveFrame, setLiveFrame] = useState('');

  // Keep scoreRef in sync for timer safety
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

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

  // Filtered pool based on selected category
  const activePool = useMemo(() => {
    const pool = categoryMap[selectedCategory] || allWords;
    return pool.length >= 4 ? pool : allWords;
  }, [categoryMap, selectedCategory, allWords]);

  // Load History
  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('quizHistory')) || [];
      setHistory(savedHistory);
    } catch {
      setHistory([]);
    }
  }, []);

  // Listen to CWASA gloss updates from iframe
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

  // Stats calculation
  const totalCorrectMarks = history.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const totalPossibleMarks = history.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const averageScorePercent = totalPossibleMarks > 0 
    ? ((totalCorrectMarks / totalPossibleMarks) * 100).toFixed(1) 
    : 0;

  const getQuizLevel = (percent, totalQuizzes) => {
    if (totalQuizzes === 0) return "Newbie 🥚";
    if (percent >= 90) return "Master 👑";
    if (percent >= 80) return "Pro 🚀";
    if (percent >= 60) return "Explorer 🔍";
    if (percent >= 40) return "Learner 📚";
    return "Beginner 🌱";
  };
  const userLevel = getQuizLevel(averageScorePercent, history.length);

  // Timer Logic with stale-state protection
  useEffect(() => {
    let timer;
    if (quizState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line
  }, [quizState, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getRandomWord = (list) => list[Math.floor(Math.random() * list.length)];
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Instant SiGML playback via memory cache (< 1ms)
  const playAnimation = useCallback((wordItem) => {
    if (!wordItem || !iframeRef.current) return;
    const resolved = resolveSigmlPath(wordItem.file);
    playSiGMLFast(iframeRef.current, resolved);
  }, []);

  // Question generator with zero delay & background prefetching of next question
  const prepareQuestion = useCallback((wordToUse = null) => {
    setFeedback('');
    setHasGuessed(false);
    setSelectedChoice(null);

    const pool = activePool.length >= 4 ? activePool : allWords;
    const correct = wordToUse || getRandomWord(pool);
    setCurrentWord(correct);

    // Pick 3 distinct wrong options
    const wrongOptions = [];
    const usedLabels = new Set([correct.label.toLowerCase()]);
    let safetyCounter = 0;

    while (wrongOptions.length < 3 && safetyCounter < 100) {
      safetyCounter++;
      const candidate = getRandomWord(allWords);
      const lower = candidate.label.toLowerCase();
      if (!usedLabels.has(lower)) {
        usedLabels.add(lower);
        wrongOptions.push(candidate);
      }
    }

    const shuffled = shuffleArray([correct, ...wrongOptions]);
    setOptions(shuffled);

    // Play immediately
    playAnimation(correct);

    // Prefetch the NEXT word in background so transition has 0ms latency
    const upcoming = getRandomWord(pool);
    setNextWord(upcoming);
    fetchAndCacheSiGML(resolveSigmlPath(upcoming.file)).catch(() => {});
  }, [activePool, allWords, playAnimation]);

  // Start Quiz (Instantaneous, 0ms latency)
  const startQuiz = (totalQs) => {
    setSelectedTotal(totalQs);
    setTimeLeft(totalQs * 6); 
    setScore(0);
    scoreRef.current = 0;
    setAttempts(0);
    setQuizState('playing');
    
    // Launch question instantly
    prepareQuestion();
  };

  // Handle Guess (Millisecond response: updates state immediately)
  const handleGuess = useCallback((selectedItem) => {
    if (hasGuessed || quizState !== 'playing' || !currentWord) return;

    setHasGuessed(true);
    setSelectedChoice(selectedItem);
    setAttempts(prev => prev + 1);

    const isCorrect = selectedItem.label.toLowerCase() === currentWord.label.toLowerCase();
    if (isCorrect) {
      setScore(prev => {
        const updated = prev + 1;
        scoreRef.current = updated;
        return updated;
      });
      setFeedback('🎉 Correct! Fast answer registered.');
    } else {
      setFeedback(`❌ Incorrect. Correct sign was: "${currentWord.label}".`);
    }
  }, [hasGuessed, quizState, currentWord]);

  // Game Over with final streak & history save
  const handleGameOver = useCallback((isTimeUp = false) => {
    setQuizState('gameover');
    if (isTimeUp) {
      setFeedback("⏰ Time's Up!");
    }
    
    const finalScore = scoreRef.current;
    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: finalScore,
      total: selectedTotal,
      timeOut: isTimeUp
    };
    
    setHistory(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('quizHistory', JSON.stringify(updated));
      return updated;
    });
    updateStreak();
  }, [selectedTotal]);

  // Advance to Next Question
  const handleNext = useCallback(() => {
    if (attempts >= selectedTotal) {
      handleGameOver(false);
    } else {
      prepareQuestion(nextWord);
    }
  }, [attempts, selectedTotal, nextWord, prepareQuestion, handleGameOver]);

  // Keyboard Shortcuts (1, 2, 3, 4 for options, Space/Enter for Next, R for Replay)
  useEffect(() => {
    if (quizState !== 'playing') return;

    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (!hasGuessed) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (options[idx]) {
            handleGuess(options[idx]);
          }
        }
      } else {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleNext();
        }
      }

      if (e.key.toLowerCase() === 'r' && currentWord) {
        e.preventDefault();
        playAnimation(currentWord);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quizState, hasGuessed, options, handleGuess, handleNext, currentWord, playAnimation]);

  const clearHistory = () => {
    if (window.confirm("Clear all quiz history? Your overall level will reset to Newbie.")) {
      setHistory([]);
      localStorage.removeItem('quizHistory');
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
      
      {/* Left Panel: Quiz Controller */}
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
        {quizState === 'setup' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            {/* User Level Banner */}
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              backgroundColor: '#003366', padding: '15px 20px', borderRadius: '12px', 
              marginBottom: '20px', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>Your Quiz Rank</h3>
                <span style={{ backgroundColor: '#f39c12', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                  {userLevel}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '20px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2ecc71' }}>{averageScorePercent}%</div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>Overall Accuracy</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{history.length}</div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>Quizzes Played</div>
                </div>
              </div>
            </div>

            <h1 style={{ color: '#003366', fontSize: '26px', margin: '0 0 8px 0', fontWeight: '800' }}>
              ⚡ Lightning Sign Quiz
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '18px' }}>
              Super-fast responses in milliseconds. Use keyboard keys <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', fontWeight: '700' }}>1</kbd>-<kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', fontWeight: '700' }}>4</kbd> to guess instantly!
            </p>

            {/* Category Filter Pills */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>
                CHOOSE VOCABULARY CATEGORY:
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
                        border: isSel ? '2px solid #003366' : '1px solid #cbd5e1',
                        backgroundColor: isSel ? '#003366' : '#f8fafc',
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

            {/* Question count selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '22px' }}>
              {[5, 10, 15, 20, 30, 50].map(num => (
                <button
                  key={num}
                  onClick={() => startQuiz(num)}
                  style={{
                    padding: '14px', backgroundColor: '#f8fafc', border: '2px solid #38bdf8', 
                    borderRadius: '10px', fontSize: '16px', fontWeight: '800', color: '#003366',
                    cursor: 'pointer', transition: 'all 0.15s ease', outline: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e0f2fe'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span>{num} Questions</span>
                  <span style={{ fontSize: '12px', color: '#ea580c', fontWeight: '600' }}>⏱️ {Math.max(1, Math.round(num * 0.1))} min</span>
                </button>
              ))}
            </div>

            {history.length > 0 && (
              <button 
                onClick={() => setQuizState('history')}
                style={{
                  width: '100%', padding: '12px', backgroundColor: 'transparent', border: '2px solid #003366',
                  color: '#003366', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f0f4f8'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                📜 View Full History ({history.length} games)
              </button>
            )}
          </div>
        )}

        {/* --- HISTORY SCREEN --- */}
        {quizState === 'history' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: '#003366', margin: '0 0 16px 0', fontSize: '24px', fontWeight: '800' }}>Past Scores</h2>
            
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', backgroundColor: '#fafafa', marginBottom: '16px' }}>
              {history.map((record) => (
                <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f1f5f9', fontSize: '14.5px' }}>
                  <span style={{ color: '#475569' }}>
                    {record.date} {record.timeOut && <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: 'bold' }}>(Time Out)</span>}
                  </span>
                  <span style={{ fontWeight: '800', color: (record.score / record.total) >= 0.7 ? '#16a34a' : '#dc2626' }}>
                    {record.score} / {record.total} ({Math.round((record.score / record.total) * 100)}%)
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
                onClick={() => setQuizState('setup')}
                style={{ flex: 1, padding: '12px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
              >
                🔙 Back to Setup
              </button>
            </div>
          </div>
        )}

        {/* --- PLAYING SCREEN --- */}
        {quizState === 'playing' && (
          <>
            {/* Live Status Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#ecfdf5', padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #a7f3d0' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#047857' }}>
                  Score: {score} / {selectedTotal}
                </span>
              </div>
              <div style={{
                backgroundColor: timeLeft <= 10 ? '#fef2f2' : '#fffbeb',
                padding: '8px 14px', borderRadius: '8px',
                border: `1.5px solid ${timeLeft <= 10 ? '#fecaca' : '#fde68a'}`,
                animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none'
              }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: timeLeft <= 10 ? '#dc2626' : '#b45309' }}>
                  ⏳ {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', color: '#475569', fontSize: '14px' }}>
              <span>Watch Avatar and press <kbd style={{ padding: '2px 5px', background: '#e2e8f0', borderRadius: '4px', fontWeight: '700' }}>1-4</kbd></span>
              <span style={{ fontWeight: '800', color: '#003366' }}>
                Question {Math.min(attempts + 1, selectedTotal)} of {selectedTotal}
              </span>
            </div>

            {/* Replay Button with shortcut hint */}
            <button 
              onClick={() => playAnimation(currentWord)}
              style={{
                width: '100%', padding: '10px', backgroundColor: '#f59e0b', color: '#ffffff',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer', marginBottom: '18px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', boxShadow: '0 2px 6px rgba(245,158,11,0.25)'
              }}
            >
              <span>🔄 Replay Avatar Animation</span>
              <span style={{ fontSize: '11px', opacity: 0.8 }}>(Press 'R')</span>
            </button>

            {/* 4 Interactive Option Cards with Millisecond Color Transitions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {options.map((item, index) => {
                const isSelected = selectedChoice?.label === item.label;
                const isCorrect = item.label.toLowerCase() === currentWord?.label.toLowerCase();

                let bgColor = '#ffffff';
                let textColor = '#0f172a';
                let borderColor = '#cbd5e1';
                let indicator = `${index + 1}`;

                if (hasGuessed) {
                  if (isCorrect) {
                    bgColor = '#16a34a';
                    textColor = '#ffffff';
                    borderColor = '#15803d';
                    indicator = '✓';
                  } else if (isSelected && !isCorrect) {
                    bgColor = '#dc2626';
                    textColor = '#ffffff';
                    borderColor = '#b91c1c';
                    indicator = '✗';
                  } else {
                    bgColor = '#f1f5f9';
                    textColor = '#94a3b8';
                    borderColor = '#e2e8f0';
                  }
                }

                return (
                  <button
                    key={index}
                    disabled={hasGuessed}
                    onClick={() => handleGuess(item)}
                    style={{
                      padding: '16px 14px',
                      borderRadius: '10px',
                      cursor: hasGuessed ? 'default' : 'pointer',
                      fontSize: '15px',
                      fontWeight: '800',
                      textAlign: 'left',
                      backgroundColor: bgColor,
                      color: textColor,
                      border: `2px solid ${borderColor}`,
                      transition: 'transform 0.1s, background-color 0.1s',
                      outline: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                    }}
                    onMouseOver={(e) => {
                      if (!hasGuessed) {
                        e.currentTarget.style.borderColor = '#003366';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!hasGuessed) {
                        e.currentTarget.style.borderColor = borderColor;
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: hasGuessed && (isCorrect || isSelected) ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                      color: hasGuessed && (isCorrect || isSelected) ? '#ffffff' : '#334155',
                      fontSize: '12px',
                      fontWeight: '800'
                    }}>
                      {indicator}
                    </span>
                    <span style={{ flex: 1, textTransform: 'capitalize' }}>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Instant Feedback Pill */}
            {feedback && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                textAlign: 'center',
                backgroundColor: feedback.includes('Correct') ? '#dcfce7' : '#fee2e2',
                border: `1.5px solid ${feedback.includes('Correct') ? '#86efac' : '#fca5a5'}`,
                marginBottom: '16px'
              }}>
                <p style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: feedback.includes('Correct') ? '#15803d' : '#b91c1c' }}>
                  {feedback}
                </p>
              </div>
            )}

            {/* Next Question / Finish Button */}
            {hasGuessed && (
              <button 
                onClick={handleNext}
                autoFocus 
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: attempts >= selectedTotal ? '#0284c7' : '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                }}
              >
                <span>{attempts >= selectedTotal ? 'See Final Score 🏆' : 'Next Question ➔'}</span>
                <span style={{ fontSize: '12px', opacity: 0.85 }}>(or press Space ↵)</span>
              </button>
            )}
          </>
        )}

        {/* --- GAME OVER SCREEN --- */}
        {quizState === 'gameover' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {feedback === "⏰ Time's Up!" ? '⏳' : (score / selectedTotal >= 0.7 ? '🏆' : '👍')}
              </div>
              <h2 style={{ color: '#003366', margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800' }}>
                {feedback === "⏰ Time's Up!" ? "Time's Up!" : 'Quiz Completed!'}
              </h2>
              <p style={{ fontSize: '16px', color: '#475569', margin: '0 0 12px 0' }}>
                You scored <strong style={{ color: '#16a34a', fontSize: '22px' }}>{score}</strong> out of {selectedTotal} ({Math.round((score / selectedTotal) * 100)}%).
              </p>
              <div style={{ display: 'inline-block', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: '700' }}>
                Accuracy Rating: {Math.round((score / selectedTotal) * 100)}%
              </div>
            </div>

            <button 
              onClick={() => setQuizState('setup')}
              style={{
                width: '100%', padding: '14px', backgroundColor: '#003366', color: 'white',
                border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '800',
                cursor: 'pointer', marginBottom: '20px'
              }}
            >
              🔄 Play Another Quiz
            </button>

            <h3 style={{ margin: '0 0 10px 0', color: '#334155', fontSize: '15px', fontWeight: '700' }}>Recent Quiz History</h3>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', backgroundColor: '#fafafa' }}>
              {history.slice(0, 6).map((record) => (
                <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #f1f5f9', fontSize: '13.5px' }}>
                  <span style={{ color: '#64748b' }}>{record.date}</span>
                  <span style={{ fontWeight: '800', color: (record.score / record.total) >= 0.7 ? '#16a34a' : '#dc2626' }}>
                    {record.score} / {record.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Avatar Viewer with Bottom Gloss HUD & Anti-Cheat Shield */}
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
              if (quizState === 'playing' && currentWord) {
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
              {hasGuessed || quizState !== 'playing' ? (liveGloss || currentWord?.label?.toUpperCase() || 'READY') : '???'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '6px', color: '#dcfce7', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              Mode: <strong style={{ color: '#ffffff' }}>{quizState === 'playing' ? 'Active Quiz' : 'Quiz Hub'}</strong>
            </span>
            {hasGuessed && currentWord && (
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

          {/* NO CHEATING Box Overlay - hides the details while guessing */}
          {quizState === 'playing' && !hasGuessed && (
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
                <span>🔒 NO CHEATING! 👀</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}