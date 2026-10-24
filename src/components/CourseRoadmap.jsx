import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import courseData from '../data/courseData.json';

const STORAGE_KEY = 'signverse_premium_unlocked';

export default function CourseRoadmap({ onSelectLevel, onLevelSelect }) {
  const navigate = useNavigate();
  const selectCallback = onLevelSelect || onSelectLevel;

  // State: Manage isUnlocked with localStorage persistence
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return (
      localStorage.getItem('signverse_premium_unlocked') === 'true' ||
      localStorage.getItem('signverse_premium_courses_unlocked') === 'true'
    );
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingLevel, setPendingLevel] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, isUnlocked ? 'true' : 'false');
  }, [isUnlocked]);

  // Show auto-dismissing toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  // Node Click Logic
  const handleLevelClick = (level) => {
    if (level.isPremium && !isUnlocked) {
      setPendingLevel(level);
      setIsPaymentModalOpen(true);
      return;
    }

    // Level is accessible: route to LessonEngine passing level data
    if (selectCallback) {
      selectCallback(level);
    } else {
      navigate(`/course/${level.id}`, { state: { level } });
    }
  };

  // Simulate Payment Handler
  const handleSimulatePayment = () => {
    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsUnlocked(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsPaymentModalOpen(false);

      showToast('🎉 Payment Successful! ₹499 verified. All premium levels permanently unlocked!');

      // Optionally navigate into pending level directly
      if (pendingLevel) {
        const target = pendingLevel;
        setPendingLevel(null);
        setTimeout(() => {
          if (selectCallback) {
            selectCallback(target);
          } else {
            navigate(`/course/${target.id}`, { state: { level: target } });
          }
        }, 1200);
      }
    }, 800);
  };

  // Demo Reset Helper for evaluators / judges
  const handleResetLock = () => {
    setIsUnlocked(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('signverse_premium_courses_unlocked');
    showToast('🔒 Premium lock reset to demo state.');
  };

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '36px 16px 80px',
        minHeight: '85vh',
        position: 'relative'
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '76px',
            right: '20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '14px 22px',
            borderRadius: '14px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #38bdf8',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <span style={{ fontSize: '20px' }}>✨</span>
          <span style={{ fontSize: '14px', fontWeight: '700' }}>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '48px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '32px 20px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#e0f2fe',
            color: '#0284c7',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px'
          }}
        >
          <span>🏆</span>
          <span>Gamified Learning Path</span>
        </div>

        <h1
          style={{
            fontSize: '32px',
            fontWeight: '900',
            color: '#0f172a',
            letterSpacing: '-0.5px',
            margin: '0 0 10px'
          }}
        >
          SignVerse Course Roadmap
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: '#64748b',
            maxWidth: '640px',
            margin: '0 auto 20px',
            lineHeight: '1.6'
          }}
        >
          Follow the winding interactive trail to learn 3D Sign Language from foundational letters
          to advanced conversational mastery.
        </p>

        {/* Status Bar */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: '#f8fafc',
            padding: '8px 20px',
            borderRadius: '30px',
            border: '1px solid #e2e8f0',
            fontSize: '13.5px',
            fontWeight: '700'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Status:</span>
            {isUnlocked ? (
              <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>✨</span>
                <span>Premium Pass Active</span>
              </span>
            ) : (
              <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🌱</span>
                <span>Free Tier (Level 1 Unlocked)</span>
              </span>
            )}
          </div>

          <div style={{ color: '#cbd5e1' }}>•</div>

          {isUnlocked ? (
            <button
              onClick={handleResetLock}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Reset Demo Lock
            </button>
          ) : (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              style={{
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
              }}
            >
              💎 Unlock All ₹499
            </button>
          )}
        </div>
      </div>

      {/* Winding Vertical Road Map Path */}
      <div
        style={{
          position: 'relative',
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '70px'
        }}
      >
        {/* Curving SVG Connector Road Path */}
        <svg
          style={{
            position: 'absolute',
            top: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '320px',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        >
          <path
            d="M 120 40 Q 220 160 180 270 T 130 520"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="10"
            strokeDasharray="14 10"
            strokeLinecap="round"
          />
          {isUnlocked && (
            <path
              d="M 120 40 Q 220 160 180 270 T 130 520"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeDasharray="8 8"
              strokeLinecap="round"
              opacity="0.6"
            />
          )}
        </svg>

        {/* Level Nodes in Winding Order */}
        {courseData.map((level, index) => {
          const isLevelLocked = level.isPremium && !isUnlocked;
          // Alternate horizontal alignment for winding road feel: 0 -> Left, 1 -> Right, 2 -> Left
          const isLeft = index % 2 === 0;

          return (
            <div
              key={level.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: isLeft ? 'row' : 'row-reverse',
                gap: '28px',
                width: '100%',
                maxWidth: '680px',
                position: 'relative',
                zIndex: 1
              }}
            >
              {/* Circular Interactive Node */}
              <div
                onClick={() => handleLevelClick(level)}
                role="button"
                tabIndex={0}
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  backgroundColor: isLevelLocked ? '#94a3b8' : level.color || '#3b82f6',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                  boxShadow: isLevelLocked
                    ? '0 6px 12px rgba(148, 163, 184, 0.4)'
                    : `0 12px 24px -4px ${level.color}88, 0 6px 12px -2px ${level.color}66`,
                  border: isLevelLocked ? '4px solid #cbd5e1' : '4px solid #ffffff',
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  position: 'relative',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1.0)';
                }}
              >
                {/* Lock Badge or Star Badge */}
                {isLevelLocked ? (
                  <span style={{ fontSize: '32px' }}>🔒</span>
                ) : (
                  <>
                    <span style={{ fontSize: '13px', fontWeight: '800', opacity: 0.85 }}>LEVEL</span>
                    <span style={{ fontSize: '28px', fontWeight: '900', lineHeight: 1 }}>
                      {level.levelNumber}
                    </span>
                  </>
                )}

                {/* Sub status pill */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-12px',
                    backgroundColor: isLevelLocked ? '#64748b' : '#0f172a',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  {isLevelLocked ? 'LOCKED' : 'PLAY'}
                </div>
              </div>

              {/* Informational Level Card */}
              <div
                onClick={() => handleLevelClick(level)}
                style={{
                  flex: 1,
                  maxWidth: '360px',
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  padding: '18px 22px',
                  border: isLevelLocked ? '1px dashed #cbd5e1' : '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  opacity: isLevelLocked ? 0.85 : 1,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      backgroundColor: isLevelLocked ? '#f1f5f9' : `${level.color}22`,
                      color: isLevelLocked ? '#64748b' : level.color
                    }}
                  >
                    {level.badge || (level.isPremium ? '💎 Premium' : '🌱 Free')}
                  </span>

                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669' }}>
                    +{level.xpReward || 150} XP
                  </span>
                </div>

                <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
                  {level.title}
                </h2>

                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px', lineHeight: '1.4' }}>
                  {level.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                >
                  <span style={{ color: '#475569' }}>
                    📖 {level.lessons.length} Interactive Lessons
                  </span>

                  <span style={{ color: isLevelLocked ? '#d97706' : '#2563eb' }}>
                    {isLevelLocked ? 'Unlock Level →' : 'Start Lesson →'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SLEEK GLASSMORPHISM MOCK PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}
          onClick={() => setIsPaymentModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '480px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              animation: 'scaleUp 0.25s ease-out',
              position: 'relative'
            }}
          >
            {/* Modal Top Header with Gradient */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%)',
                padding: '28px 24px',
                color: '#ffffff',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '700'
                }}
              >
                ✕
              </button>

              <div style={{ fontSize: '48px', marginBottom: '8px' }}>💎</div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
                Unlock Premium Course Access
              </h2>
              <p style={{ fontSize: '13.5px', color: '#bfdbfe', margin: 0 }}>
                Accelerate your fluency with full 3D interactive course levels & visual quizzes
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Pricing Box */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '2px solid #e0e7ff',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#4338ca', textTransform: 'uppercase' }}>
                    Hackathon All-Access Pass
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Lifetime unlock for all levels
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a' }}>
                    ₹499
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                    ₹1,499 (67% OFF)
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#334155' }}>
                  <span>🛒</span>
                  <span><strong>Level 2: The Grocery Run</strong> (Visual Select activity)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#334155' }}>
                  <span>👑</span>
                  <span><strong>Level 3: Community & Family</strong> (Two-handed signs)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#334155' }}>
                  <span>🔄</span>
                  <span>Unlimited 3D avatar replays & slow-motion inspection</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#334155' }}>
                  <span>🏆</span>
                  <span>Level completion badges & leaderboard XP bonuses</span>
                </div>
              </div>

              {/* Simulate Payment Button */}
              <button
                onClick={handleSimulatePayment}
                disabled={isProcessingPayment}
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '800',
                  cursor: isProcessingPayment ? 'wait' : 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}
              >
                {isProcessingPayment ? (
                  <>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }}
                    />
                    <span>Processing Demo Payment...</span>
                  </>
                ) : (
                  <>
                    <span>💳</span>
                    <span>Simulate Payment (Demo ₹499)</span>
                  </>
                )}
              </button>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  fontSize: '11px',
                  color: '#94a3b8'
                }}
              >
                🔒 Demo mode: No real credit card or bank details required. Instant unlock.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
