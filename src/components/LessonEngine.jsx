import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CWASA3DAvatar from './CWASA3DAvatar';
import courseData from '../data/courseData.json';

export default function LessonEngine({
  lesson: propLesson,
  levelData: propLevelData,
  onBack: propOnBack,
  currentLessonIndex: propCurrentLessonIndex,
  onNextLesson: propOnNextLesson
}) {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Find level from props, route params, or location state
  const activeLevel =
    propLevelData ||
    (propLesson && courseData.find((lvl) => lvl.lessons && lvl.lessons.some((l) => l.id === propLesson.id))) ||
    (location.state && location.state.level) ||
    courseData.find((l) => l.id === levelId) ||
    courseData[0];

  // If a specific lesson prop was passed, find its index in the level
  const initialLessonIndex =
    propCurrentLessonIndex !== undefined
      ? propCurrentLessonIndex
      : propLesson && activeLevel?.lessons
      ? Math.max(0, activeLevel.lessons.findIndex((l) => l.id === propLesson.id))
      : 0;

  const [currentLessonIndex, setCurrentLessonIndex] = useState(initialLessonIndex);

  // Sync index if controlled by parent
  useEffect(() => {
    if (propCurrentLessonIndex !== undefined) {
      setCurrentLessonIndex(propCurrentLessonIndex);
    }
  }, [propCurrentLessonIndex]);

  // Sync index if lesson prop changes
  useEffect(() => {
    if (propLesson && activeLevel?.lessons) {
      const idx = activeLevel.lessons.findIndex((l) => l.id === propLesson.id);
      if (idx !== -1) {
        setCurrentLessonIndex(idx);
      }
    }
  }, [propLesson, activeLevel]);
  const [score, setScore] = useState(0);
  const [lessonStatus, setLessonStatus] = useState(null); // 'correct' | 'incorrect' | null
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLevelFinished, setIsLevelFinished] = useState(false);

  // Drag-and-drop state
  const [placedLetters, setPlacedLetters] = useState([]);
  const [availableLetters, setAvailableLetters] = useState([]);

  const currentLesson = activeLevel?.lessons?.[currentLessonIndex] || activeLevel?.lessons?.[0];
  const totalLessons = activeLevel?.lessons?.length || 1;

  // Initialize lesson-specific state when lesson index changes
  useEffect(() => {
    setLessonStatus(null);
    setSelectedOption(null);

    if (currentLesson && currentLesson.type === 'drag-drop') {
      const letters = currentLesson.initialLetters || ['M', 'A', 'E', 'N'];
      setAvailableLetters(letters.map((char, index) => ({ id: `${char}-${index}`, char })));
      setPlacedLetters([]);
    }
  }, [currentLessonIndex, currentLesson]);

  const handleBack = () => {
    if (propOnBack) {
      propOnBack();
    } else {
      navigate('/course');
    }
  };

  // Multiple Choice Handler
  const handleMultipleChoiceSelect = (option) => {
    if (lessonStatus === 'correct') return; // already solved

    setSelectedOption(option);
    const isCorrect = option === currentLesson.answer;

    if (isCorrect) {
      setLessonStatus('correct');
      setScore((prev) => prev + 50);
    } else {
      setLessonStatus('incorrect');
    }
  };

  // Visual Select Handler
  const handleVisualSelect = (option) => {
    if (lessonStatus === 'correct') return;

    setSelectedOption(option.label);
    const isCorrect = option.label === currentLesson.answer;

    if (isCorrect) {
      setLessonStatus('correct');
      setScore((prev) => prev + 50);
    } else {
      setLessonStatus('incorrect');
    }
  };

  // Drag and Drop (Letter Placement) Handlers
  const handleTileClickToPlace = (letterObj) => {
    if (lessonStatus === 'correct') return;

    // Move from available to placed
    setAvailableLetters((prev) => prev.filter((item) => item.id !== letterObj.id));
    const newPlaced = [...placedLetters, letterObj];
    setPlacedLetters(newPlaced);

    // Check if target length reached
    const target = currentLesson.targetWord || currentLesson.answer || 'NAME';
    if (newPlaced.length === target.length) {
      const word = newPlaced.map((l) => l.char).join('');
      if (word === target) {
        setLessonStatus('correct');
        setScore((prev) => prev + 50);
      } else {
        setLessonStatus('incorrect');
      }
    }
  };

  const handleSlotClickToRemove = (index) => {
    if (lessonStatus === 'correct') return;

    const removedLetter = placedLetters[index];
    if (!removedLetter) return;

    const newPlaced = [...placedLetters];
    newPlaced.splice(index, 1);
    setPlacedLetters(newPlaced);
    setAvailableLetters((prev) => [...prev, removedLetter]);
    setLessonStatus(null);
  };

  const handleResetLetters = () => {
    const letters = currentLesson.initialLetters || ['M', 'A', 'E', 'N'];
    setAvailableLetters(letters.map((char, index) => ({ id: `${char}-${index}`, char })));
    setPlacedLetters([]);
    setLessonStatus(null);
  };

  // Next Lesson Iterator
  const handleNextLesson = () => {
    if (propOnNextLesson) {
      propOnNextLesson();
      return;
    }
    if (currentLessonIndex < totalLessons - 1) {
      setCurrentLessonIndex((prev) => prev + 1);
    } else {
      setIsLevelFinished(true);
    }
  };

  // Replay Level
  const handleRestartLevel = () => {
    setCurrentLessonIndex(0);
    setScore(0);
    setIsLevelFinished(false);
  };

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px 60px',
        minHeight: '85vh',
        color: '#1e293b'
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <button
          onClick={handleBack}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '700',
            color: '#334155',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <span>←</span>
          <span>Back to Roadmap</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⭐</span>
            <span>Score: {score} XP</span>
          </div>

          <div
            style={{
              backgroundColor: '#f1f5f9',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#475569'
            }}
          >
            Lesson {currentLessonIndex + 1} of {totalLessons}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          marginBottom: '24px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${((currentLessonIndex + (lessonStatus === 'correct' ? 1 : 0.5)) / totalLessons) * 100}%`,
            height: '100%',
            backgroundColor: activeLevel?.color || '#10b981',
            borderRadius: '4px',
            transition: 'width 0.3s ease-in-out'
          }}
        />
      </div>

      {/* Level Completion Screen */}
      {isLevelFinished ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '48px 24px',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '40px auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0'
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            Level Completed!
          </h2>
          <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '24px' }}>
            Outstanding work! You mastered <strong>{activeLevel.title}</strong> and refined your 3D sign language skills.
          </p>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-around',
              marginBottom: '32px'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>TOTAL SCORE</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669' }}>+{score} XP</div>
            </div>
            <div style={{ borderRight: '1px solid #cbd5e1' }} />
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>MASTERY</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>100%</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleRestartLevel}
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #cbd5e1',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              🔄 Replay Level
            </button>
            <button
              onClick={handleBack}
              style={{
                backgroundColor: '#10b981',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
              }}
            >
              🚀 Continue on Roadmap
            </button>
          </div>
        </div>
      ) : (
        /* Main Interactive Layout: 2 Columns on Desktop, Stacked on Mobile */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
            alignItems: 'start'
          }}
        >
          {/* Left / Top Panel: 3D Avatar Synthesizer */}
          <div>
            <CWASA3DAvatar sigml={currentLesson?.sigml} title={currentLesson?.title} height="400px" />

            {/* Lesson Info Card */}
            <div
              style={{
                marginTop: '16px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '18px 20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span
                  style={{
                    backgroundColor: activeLevel.color,
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    textTransform: 'uppercase'
                  }}
                >
                  {currentLesson?.type}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                  {activeLevel.title}
                </span>
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                {currentLesson?.title}
              </h1>
              <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                {currentLesson?.description}
              </p>
            </div>
          </div>

          {/* Right / Bottom Panel: Dynamic Interactive Activity Area */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.06)'
            }}
          >
            {/* Prompt Box */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderLeft: `4px solid ${activeLevel.color}`,
                padding: '14px 16px',
                borderRadius: '8px',
                marginBottom: '24px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Task Objective
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                {currentLesson?.prompt}
              </div>
            </div>

            {/* CONDITIONAL ACTIVITY 1: Multiple Choice */}
            {currentLesson?.type === 'multiple-choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentLesson.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === currentLesson.answer;

                  let bgColor = '#ffffff';
                  let borderColor = '#cbd5e1';
                  let textColor = '#1e293b';

                  if (isSelected) {
                    if (isCorrect) {
                      bgColor = '#dcfce7';
                      borderColor = '#22c55e';
                      textColor = '#15803d';
                    } else {
                      bgColor = '#fee2e2';
                      borderColor = '#ef4444';
                      textColor = '#b91c1c';
                    }
                  } else if (lessonStatus === 'correct' && isCorrect) {
                    bgColor = '#dcfce7';
                    borderColor = '#22c55e';
                    textColor = '#15803d';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleMultipleChoiceSelect(option)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '14px',
                        border: `2px solid ${borderColor}`,
                        backgroundColor: bgColor,
                        color: textColor,
                        fontSize: '16px',
                        fontWeight: '700',
                        cursor: lessonStatus === 'correct' ? 'default' : 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 4px 6px -1px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: '800'
                          }}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>
                      {isSelected && (
                        <span>{isCorrect ? '✅ Correct' : '❌ Try Again'}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* CONDITIONAL ACTIVITY 2: Drag and Drop (Letter Placement) */}
            {currentLesson?.type === 'drag-drop' && (
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                  Tap letters below to place them into the slots, or tap a placed letter to return it:
                </p>

                {/* Target Slots */}
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    marginBottom: '28px'
                  }}
                >
                  {Array.from({ length: (currentLesson.targetWord || 'NAME').length }).map((_, index) => {
                    const placed = placedLetters[index];
                    return (
                      <div
                        key={index}
                        onClick={() => placed && handleSlotClickToRemove(index)}
                        style={{
                          width: '60px',
                          height: '68px',
                          borderRadius: '14px',
                          border: placed
                            ? lessonStatus === 'correct'
                              ? '3px solid #10b981'
                              : '3px solid #10b981'
                            : '2px dashed #94a3b8',
                          backgroundColor: placed
                            ? lessonStatus === 'correct'
                              ? '#dcfce7'
                              : '#ecfdf5'
                            : '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '28px',
                          fontWeight: '800',
                          color: lessonStatus === 'correct' ? '#15803d' : '#065f46',
                          cursor: placed ? 'pointer' : 'default',
                          userSelect: 'none',
                          boxShadow: placed ? '0 4px 6px -1px rgba(0,0,0,0.08)' : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        {placed ? placed.char : ''}
                      </div>
                    );
                  })}
                </div>

                {/* Letter Bank to Select From */}
                <div
                  style={{
                    backgroundColor: '#f1f5f9',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                      AVAILABLE LETTERS
                    </span>
                    <button
                      onClick={handleResetLetters}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        textDecoration: 'underline'
                      }}
                    >
                      Reset Letters
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', minHeight: '56px' }}>
                    {availableLetters.length === 0 ? (
                      <span style={{ fontSize: '13px', color: '#94a3b8', alignSelf: 'center' }}>
                        All letters placed!
                      </span>
                    ) : (
                      availableLetters.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleTileClickToPlace(item)}
                          style={{
                            width: '54px',
                            height: '54px',
                            backgroundColor: '#ffffff',
                            border: '2px solid #cbd5e1',
                            borderRadius: '12px',
                            fontSize: '24px',
                            fontWeight: '800',
                            color: '#1e293b',
                            cursor: 'pointer',
                            boxShadow: '0 3px 5px rgba(0,0,0,0.08)',
                            transition: 'transform 0.1s, border-color 0.1s'
                          }}
                        >
                          {item.char}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CONDITIONAL ACTIVITY 3: Visual Select (Grocery Items) */}
            {currentLesson?.type === 'visual-select' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '14px'
                }}
              >
                {currentLesson.options.map((option) => {
                  const isSelected = selectedOption === option.label;
                  const isCorrect = option.label === currentLesson.answer;

                  let borderColor = '#e2e8f0';
                  let bgColor = '#ffffff';

                  if (isSelected) {
                    borderColor = isCorrect ? '#22c55e' : '#ef4444';
                    bgColor = isCorrect ? '#f0fdf4' : '#fef2f2';
                  } else if (lessonStatus === 'correct' && isCorrect) {
                    borderColor = '#22c55e';
                    bgColor = '#f0fdf4';
                  }

                  return (
                    <div
                      key={option.id}
                      onClick={() => handleVisualSelect(option)}
                      style={{
                        padding: '16px 12px',
                        borderRadius: '16px',
                        border: `2px solid ${borderColor}`,
                        backgroundColor: bgColor,
                        textAlign: 'center',
                        cursor: lessonStatus === 'correct' ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 6px 12px -2px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ fontSize: '42px', marginBottom: '8px' }}>{option.emoji}</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                        {option.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        {option.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Feedback Banner */}
            {lessonStatus && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  backgroundColor: lessonStatus === 'correct' ? '#dcfce7' : '#fee2e2',
                  border: `1px solid ${lessonStatus === 'correct' ? '#86efac' : '#fca5a5'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: '24px' }}>
                  {lessonStatus === 'correct' ? '🎉' : '💡'}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '800',
                      color: lessonStatus === 'correct' ? '#15803d' : '#991b1b'
                    }}
                  >
                    {lessonStatus === 'correct' ? 'Excellent! Correct Sign!' : 'Not quite right'}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: lessonStatus === 'correct' ? '#166534' : '#7f1d1d',
                      marginTop: '2px'
                    }}
                  >
                    {lessonStatus === 'correct'
                      ? currentLesson?.explanation || 'Great job matching the 3D gesture!'
                      : currentLesson?.hint || 'Review the avatar motion and try another letter or option!'}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Footer */}
            <div
              style={{
                marginTop: '28px',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '20px'
              }}
            >
              <button
                onClick={handleNextLesson}
                disabled={lessonStatus !== 'correct'}
                style={{
                  backgroundColor: lessonStatus === 'correct' ? '#10b981' : '#94a3b8',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: lessonStatus === 'correct' ? 'pointer' : 'not-allowed',
                  boxShadow:
                    lessonStatus === 'correct' ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {currentLessonIndex < totalLessons - 1 ? 'Next Lesson →' : 'Finish Level 🏆'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
