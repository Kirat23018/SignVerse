import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import modulesData from '../modulesData.json';
import { updateStreak } from '../utils/streakManager';
import { playSiGMLFast, resolveSigmlPath, fetchAndCacheSiGML } from '../utils/sigmlService';

export default function Quiz() {
  const iframeRef = useRef(null);
  const scoreRef = useRef(0);

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

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

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
    return pool.length >= 4 ? pool : allWords;
  }, [categoryMap, selectedCategory, allWords]);

  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('quizHistory')) || [];
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

  const totalCorrectMarks = history.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const totalPossibleMarks = history.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const averageScorePercent = totalPossibleMarks > 0
    ? ((totalCorrectMarks / totalPossibleMarks) * 100).toFixed(1)
    : 0;

  const getQuizLevel = (percent, totalQuizzes) => {
    if (totalQuizzes === 0) return 'Newbie';
    if (percent >= 90) return 'Master';
    if (percent >= 80) return 'Pro';
    if (percent >= 60) return 'Explorer';
    if (percent >= 40) return 'Learner';
    return 'Beginner';
  };
  const userLevel = getQuizLevel(averageScorePercent, history.length);

  const handleGameOver = useCallback((isTimeUp = false) => {
    setQuizState('gameover');
    if (isTimeUp) {
      setFeedback("Time's Up!");
    }

    const finalScore = scoreRef.current;
    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: finalScore,
      total: selectedTotal,
      timeOut: isTimeUp
    };

    setHistory((prev) => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('quizHistory', JSON.stringify(updated));
      return updated;
    });
    updateStreak();
  }, [selectedTotal]);

  useEffect(() => {
    let timer;
    if (quizState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
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
  }, [quizState, timeLeft, handleGameOver]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getRandomWord = (list) => list[Math.floor(Math.random() * list.length)];
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const playAnimation = useCallback((wordItem) => {
    if (!wordItem || !iframeRef.current) return;
    const resolved = resolveSigmlPath(wordItem.file);
    playSiGMLFast(iframeRef.current, resolved);
  }, []);

  const prepareQuestion = useCallback((wordToUse = null) => {
    setFeedback('');
    setHasGuessed(false);
    setSelectedChoice(null);

    const pool = activePool.length >= 4 ? activePool : allWords;
    const correct = wordToUse || getRandomWord(pool);
    setCurrentWord(correct);

    const wrongOptions = [];
    const usedLabels = new Set([correct.label.toLowerCase()]);
    let safetyCounter = 0;

    while (wrongOptions.length < 3 && safetyCounter < 100) {
      safetyCounter += 1;
      const candidate = getRandomWord(allWords);
      const lower = candidate.label.toLowerCase();
      if (!usedLabels.has(lower)) {
        usedLabels.add(lower);
        wrongOptions.push(candidate);
      }
    }

    setOptions(shuffleArray([correct, ...wrongOptions]));
    playAnimation(correct);

    const upcoming = getRandomWord(pool);
    setNextWord(upcoming);
    fetchAndCacheSiGML(resolveSigmlPath(upcoming.file)).catch(() => {});
  }, [activePool, allWords, playAnimation]);

  const startQuiz = (totalQs) => {
    setSelectedTotal(totalQs);
    setTimeLeft(totalQs * 6);
    setScore(0);
    scoreRef.current = 0;
    setAttempts(0);
    setQuizState('playing');
    prepareQuestion();
  };

  const handleGuess = useCallback((selectedItem) => {
    if (hasGuessed || quizState !== 'playing' || !currentWord) return;

    setHasGuessed(true);
    setSelectedChoice(selectedItem);
    setAttempts((prev) => prev + 1);

    const isCorrect = selectedItem.label.toLowerCase() === currentWord.label.toLowerCase();
    if (isCorrect) {
      setScore((prev) => {
        const updated = prev + 1;
        scoreRef.current = updated;
        return updated;
      });
      setFeedback('Correct! Answer registered.');
    } else {
      setFeedback(`Incorrect. Correct sign was: "${currentWord.label}".`);
    }
  }, [hasGuessed, quizState, currentWord]);

  const handleNext = useCallback(() => {
    if (attempts >= selectedTotal) {
      handleGameOver(false);
    } else {
      prepareQuestion(nextWord);
    }
  }, [attempts, selectedTotal, nextWord, prepareQuestion, handleGameOver]);

  useEffect(() => {
    if (quizState !== 'playing') return;

    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (!hasGuessed) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (options[idx]) handleGuess(options[idx]);
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
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
    setHistory([]);
    localStorage.removeItem('quizHistory');
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
        {quizState === 'setup' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Rank Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#242A27',
                border: '1px solid #3A443F',
                padding: '16px 20px',
                borderRadius: '14px',
                marginBottom: '20px'
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: '#9CAEA4', fontWeight: '700', marginBottom: '4px' }}>
                  Your Quiz Rank
                </div>
                <span style={{ backgroundColor: 'rgba(124,169,146,0.18)', color: '#A3CBB7', border: '1px solid rgba(124,169,146,0.35)', padding: '4px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: '800' }}>
                  {userLevel}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '20px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#7CA992' }}>{averageScorePercent}%</div>
                  <div style={{ fontSize: '11px', color: '#9CAEA4' }}>Overall Accuracy</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#E4EAE6' }}>{history.length}</div>
                  <div style={{ fontSize: '11px', color: '#9CAEA4' }}>Quizzes Played</div>
                </div>
              </div>
            </div>

            <h1 style={{ color: '#E4EAE6', fontSize: '26px', margin: '0 0 8px 0', fontWeight: '800' }}>
              Interactive Sign Quiz
            </h1>
            <p style={{ color: '#B5C5BC', fontSize: '14px', marginBottom: '18px' }}>
              Watch the 3D avatar and press keyboard keys <kbd style={{ padding: '2px 6px', background: '#242A27', border: '1px solid #3A443F', borderRadius: '4px', fontWeight: '700', color: '#E4EAE6' }}>1</kbd>–<kbd style={{ padding: '2px 6px', background: '#242A27', border: '1px solid #3A443F', borderRadius: '4px', fontWeight: '700', color: '#E4EAE6' }}>4</kbd> to answer.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#A3CBB7', display: 'block', marginBottom: '8px', letterSpacing: '0.6px' }}>
                CHOOSE VOCABULARY CATEGORY
              </span>
              <div role="group" aria-label="Choose vocabulary category" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
                  onClick={() => startQuiz(num)}
                  style={{
                    padding: '14px 10px',
                    backgroundColor: '#242A27',
                    border: '1.5px solid #7CA992',
                    borderRadius: '12px',
                    fontSize: '15.5px',
                    fontWeight: '800',
                    color: '#E4EAE6',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{num} Questions</span>
                  <span style={{ fontSize: '11.5px', color: '#A3CBB7', fontWeight: '600' }}>
                    {Math.max(1, Math.round(num * 0.1))} min timer
                  </span>
                </button>
              ))}
            </div>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setQuizState('history')}
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
                View Full History ({history.length} games)
              </button>
            )}
          </div>
        )}

        {quizState === 'history' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: '#E4EAE6', margin: '0 0 16px 0', fontSize: '22px', fontWeight: '800' }}>Past Scores</h2>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #2D3531', borderRadius: '12px', padding: '12px', backgroundColor: '#191C1A', marginBottom: '16px' }}>
              {history.map((record) => (
                <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 6px', borderBottom: '1px solid #242A27', fontSize: '14px' }}>
                  <span style={{ color: '#9CAEA4' }}>
                    {record.date} {record.timeOut && <span style={{ color: '#FCA5A5', fontSize: '11px', fontWeight: 'bold' }}>(Time Out)</span>}
                  </span>
                  <span style={{ fontWeight: '800', color: record.score / record.total >= 0.7 ? '#7CA992' : '#FCA5A5' }}>
                    {record.score} / {record.total} ({Math.round((record.score / record.total) * 100)}%)
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
                onClick={() => setQuizState('setup')}
                style={{ flex: 1, padding: '12px', backgroundColor: '#7CA992', color: '#0D1310', border: 'none', borderRadius: '10px', fontSize: '14.5px', fontWeight: '800', cursor: 'pointer' }}
              >
                Back to Setup
              </button>
            </div>
          </div>
        )}

        {quizState === 'playing' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ backgroundColor: 'rgba(124,169,146,0.16)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(124,169,146,0.35)' }}>
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#A3CBB7' }}>
                  Score: {score} / {selectedTotal}
                </span>
              </div>
              <div
                style={{
                  backgroundColor: timeLeft <= 10 ? '#3B1E1E' : '#242A27',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${timeLeft <= 10 ? '#EF4444' : '#3A443F'}`
                }}
              >
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: timeLeft <= 10 ? '#FECACA' : '#E4EAE6' }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', color: '#B5C5BC', fontSize: '13.5px' }}>
              <span>Watch Avatar and press 1–4</span>
              <span style={{ fontWeight: '800', color: '#A3CBB7' }}>
                Question {Math.min(attempts + 1, selectedTotal)} of {selectedTotal}
              </span>
            </div>

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
              <span>Replay Avatar Animation</span>
              <span style={{ fontSize: '11px', color: '#9CAEA4' }}>(Press R)</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {options.map((item, index) => {
                const isSelected = selectedChoice?.label === item.label;
                const isCorrect = item.label.toLowerCase() === currentWord?.label.toLowerCase();

                let bgColor = '#242A27';
                let textColor = '#E4EAE6';
                let borderColor = '#3A443F';
                let indicator = `${index + 1}`;

                if (hasGuessed) {
                  if (isCorrect) {
                    bgColor = '#7CA992';
                    textColor = '#0D1310';
                    borderColor = '#A3CBB7';
                    indicator = '✓';
                  } else if (isSelected && !isCorrect) {
                    bgColor = '#3B1E1E';
                    textColor = '#FECACA';
                    borderColor = '#EF4444';
                    indicator = '✗';
                  } else {
                    bgColor = '#191C1A';
                    textColor = '#85968C';
                    borderColor = '#2D3531';
                  }
                }

                return (
                  <button
                    type="button"
                    key={index}
                    disabled={hasGuessed}
                    onClick={() => handleGuess(item)}
                    style={{
                      padding: '16px 14px',
                      borderRadius: '12px',
                      cursor: hasGuessed ? 'default' : 'pointer',
                      fontSize: '15px',
                      fontWeight: '700',
                      textAlign: 'left',
                      backgroundColor: bgColor,
                      color: textColor,
                      border: `1.5px solid ${borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: hasGuessed && isCorrect ? 'rgba(0,0,0,0.2)' : '#191C1A',
                        color: hasGuessed && isCorrect ? '#0D1310' : '#A3CBB7',
                        fontSize: '12px',
                        fontWeight: '800',
                        flexShrink: 0
                      }}
                    >
                      {indicator}
                    </span>
                    <span style={{ flex: 1, textTransform: 'capitalize' }}>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {feedback && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  backgroundColor: feedback.includes('Correct') ? 'rgba(124,169,146,0.16)' : '#3B1E1E',
                  border: `1px solid ${feedback.includes('Correct') ? '#7CA992' : '#7F1D1D'}`,
                  marginBottom: '16px'
                }}
              >
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: feedback.includes('Correct') ? '#A3CBB7' : '#FECACA' }}>
                  {feedback}
                </p>
              </div>
            )}

            {hasGuessed && (
              <button
                type="button"
                onClick={handleNext}
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#7CA992',
                  color: '#0D1310',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>{attempts >= selectedTotal ? 'See Final Score' : 'Next Question'}</span>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>(Space)</span>
              </button>
            )}
          </>
        )}

        {quizState === 'gameover' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#242A27', borderRadius: '14px', border: '1px solid #3A443F', marginBottom: '20px' }}>
              <div aria-hidden="true" style={{ fontSize: '42px', marginBottom: '8px' }}>
                {feedback === "Time's Up!" ? '⏳' : score / selectedTotal >= 0.7 ? '🏆' : '👍'}
              </div>
              <h2 style={{ color: '#E4EAE6', margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800' }}>
                {feedback === "Time's Up!" ? "Time's Up!" : 'Quiz Completed!'}
              </h2>
              <p style={{ fontSize: '15.5px', color: '#B5C5BC', margin: '0 0 12px 0' }}>
                You scored <strong style={{ color: '#7CA992', fontSize: '20px' }}>{score}</strong> out of {selectedTotal} ({Math.round((score / selectedTotal) * 100)}%).
              </p>
              <div style={{ display: 'inline-block', backgroundColor: 'rgba(124,169,146,0.16)', color: '#A3CBB7', border: '1px solid rgba(124,169,146,0.35)', padding: '4px 14px', borderRadius: '12px', fontSize: '12.5px', fontWeight: '700' }}>
                Accuracy Rating: {Math.round((score / selectedTotal) * 100)}%
              </div>
            </div>

            <button
              type="button"
              onClick={() => setQuizState('setup')}
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
              Play Another Quiz
            </button>

            <h3 style={{ margin: '0 0 10px 0', color: '#B5C5BC', fontSize: '14.5px', fontWeight: '700' }}>Recent Quiz History</h3>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #2D3531', borderRadius: '10px', padding: '10px', backgroundColor: '#191C1A' }}>
              {history.slice(0, 6).map((record) => (
                <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #242A27', fontSize: '13.5px' }}>
                  <span style={{ color: '#9CAEA4' }}>{record.date}</span>
                  <span style={{ fontWeight: '800', color: record.score / record.total >= 0.7 ? '#7CA992' : '#FCA5A5' }}>
                    {record.score} / {record.total}
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
              if (quizState === 'playing' && currentWord) {
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
              {hasGuessed || quizState !== 'playing' ? (liveGloss || currentWord?.label?.toUpperCase() || 'READY') : 'HIDDEN'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' }}>
            {hasGuessed && currentWord && (
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

          {quizState === 'playing' && !hasGuessed && (
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
                GLOSS HIDDEN DURING QUESTION
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
