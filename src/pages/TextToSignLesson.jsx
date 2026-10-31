import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { playSiGMLFast, resolveSigmlPath, getAllVocabulary } from '../utils/sigmlService';
import { isProUnlocked } from '../utils/subscriptionManager';
import { TEXT_TO_SIGN_TRACK } from '../data/dualTrackCourses';
import UnlockProModal from '../components/UnlockProModal';

export default function TextToSignLesson() {
  const { courseId = 'tts-mod-1', lessonId = 'lesson-1' } = useParams();
  const navigate = useNavigate();

  // Find active course from 15 modules
  const course = useMemo(() => {
    return TEXT_TO_SIGN_TRACK.find((m) => m.id === courseId) || TEXT_TO_SIGN_TRACK[0];
  }, [courseId]);

  // Find active lesson within course
  const activeLessonIndex = useMemo(() => {
    const idx = course.lessons.findIndex((l) => l.id === lessonId || l.id.endsWith(lessonId.replace('lesson-', '')));
    return idx >= 0 ? idx : 0;
  }, [course, lessonId]);

  const lesson = course.lessons[activeLessonIndex] || course.lessons[0];

  // Subscription & Paywall state
  const [isPro, setIsPro] = useState(isProUnlocked());
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const isLessonLocked = (course.isLocked || lesson.isLocked) && !isPro;

  // 3D Avatar & Playback state
  const iframeRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // ================= DYNAMIC DICTIONARY ENGINE STATE =================
  const [typedInput, setTypedInput] = useState(lesson.word || 'HELLO');
  const [activeTokenLabel, setActiveTokenLabel] = useState(lesson.word || 'HELLO');
  const [activeTokenSub, setActiveTokenSub] = useState('Lesson Target Sign');
  const [activeFingerspellTokens, setActiveFingerspellTokens] = useState([]);
  const [activeTokenIndex, setActiveTokenIndex] = useState(-1);
  const [matchStatus, setMatchStatus] = useState('direct'); // 'direct' | 'fingerspell' | 'searching'

  // Pre-load dictionary lookup map
  const { lookupMap } = useMemo(() => {
    return getAllVocabulary();
  }, []);

  // Sync completed state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('signverse_completed_lessons');
      if (saved) {
        const completed = JSON.parse(saved);
        setIsCompleted(completed.includes(lesson.id));
      }
      setIsPro(isProUnlocked());
    } catch (e) {
      console.warn('Storage read error:', e);
    }
  }, [lesson.id]);

  // Update input when route lesson changes
  useEffect(() => {
    setTypedInput(lesson.word);
    setActiveTokenLabel(lesson.word);
    setActiveTokenSub('Lesson Target Word');
    setActiveFingerspellTokens([]);
    setActiveTokenIndex(-1);
    setMatchStatus('direct');
  }, [lesson.word]);

  // Sleep helper for sequential fingerspelling
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // ================= DYNAMIC DICTIONARY & FINGERSPELLING ENGINE =================
  const playWordOrFingerspell = useCallback(async (textToPlay) => {
    const raw = String(textToPlay || typedInput).trim();
    if (!raw || !iframeRef.current) return;

    setIsPlaying(true);
    const cleanLower = raw.toLowerCase().replace(/[^a-z0-9\s]/g, '');

    // 1. Check for Direct Match in Dictionary
    const match = lookupMap.get(cleanLower) || lookupMap.get(cleanLower.replace(/\s+/g, ''));

    if (match) {
      // Direct sign gesture found in database!
      setMatchStatus('direct');
      setActiveTokenLabel(match.label.toUpperCase());
      setActiveTokenSub(`Dictionary Gesture • ${match.category || 'Standard'}`);
      setActiveFingerspellTokens([]);
      setActiveTokenIndex(-1);

      const path = resolveSigmlPath(match.resolvedPath || match.file);
      await playSiGMLFast(iframeRef.current, path, speedMultiplier);

      setIsPlaying(false);
      return;
    }

    // 2. Fallback: Letter-by-Letter Fingerspelling Decomposition
    setMatchStatus('fingerspell');
    const letters = cleanLower.replace(/[^a-z]/g, '').toUpperCase().split('');

    if (letters.length === 0) {
      setIsPlaying(false);
      return;
    }

    setActiveFingerspellTokens(letters);
    setActiveTokenSub(`Decomposed Fingerspelling (${letters.length} letters)`);

    for (let i = 0; i < letters.length; i++) {
      const char = letters[i];
      setActiveTokenIndex(i);
      setActiveTokenLabel(`Letter '${char}'`);

      const letterMatch = lookupMap.get(char.toLowerCase());
      if (letterMatch) {
        const path = resolveSigmlPath(letterMatch.resolvedPath || letterMatch.file);
        await playSiGMLFast(iframeRef.current, path, speedMultiplier * 1.2);
      }
      await sleep(250 / speedMultiplier);
    }

    setActiveTokenLabel(raw.toUpperCase());
    setActiveTokenSub('Complete Fingerspelling Sequence');
    setIsPlaying(false);
  }, [typedInput, lookupMap, speedMultiplier]);

  // Handle iframe initial ready
  const handleIframeLoad = () => {
    setIsIframeLoaded(true);
  };

  // Mark lesson as complete and record progress
  const handleMarkComplete = () => {
    try {
      const saved = localStorage.getItem('signverse_completed_lessons');
      const completed = saved ? JSON.parse(saved) : [];
      if (!completed.includes(lesson.id)) {
        completed.push(lesson.id);
        localStorage.setItem('signverse_completed_lessons', JSON.stringify(completed));
      }
      setIsCompleted(true);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } catch (e) {
      console.warn('Storage write error:', e);
    }
  };

  // Navigate to next lesson in current module or next module
  const handleNextLesson = () => {
    if (activeLessonIndex < course.lessons.length - 1) {
      const nextLesson = course.lessons[activeLessonIndex + 1];
      if (nextLesson.isLocked && !isPro) {
        setIsPaywallOpen(true);
      } else {
        navigate(`/courses/text-to-sign/${course.id}/${nextLesson.id}`);
      }
    } else {
      navigate('/courses');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#191C1A',
        color: '#E4EAE6',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '24px 20px 80px',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* Background Ambient Glows */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '15%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 169, 146, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div style={{ maxWidth: '1360px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* Navigation Breadcrumb Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#9CAEA4' }}>
              <Link to="/" style={{ color: '#7CA992', textDecoration: 'none', fontWeight: '600' }}>Home</Link>
              <span>/</span>
              <Link to="/courses" style={{ color: '#7CA992', textDecoration: 'none', fontWeight: '600' }}>Courses</Link>
              <span>/</span>
              <span style={{ color: '#E4EAE6' }}>{course.title}</span>
            </div>

            <h2 style={{ margin: 0, fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: '800', color: '#E4EAE6', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>{course.icon} {course.title}</span>
              <span style={{ fontSize: '12px', fontWeight: '800', background: course.isLocked ? 'rgba(245, 158, 11, 0.15)' : 'rgba(124, 169, 146, 0.15)', color: course.isLocked ? '#fbbf24' : '#7CA992', padding: '3px 10px', borderRadius: '12px', border: `1px solid ${course.isLocked ? 'rgba(245, 158, 11, 0.3)' : 'rgba(124, 169, 146, 0.3)'}` }}>
                {course.tier.toUpperCase()} TIER • LESSON {activeLessonIndex + 1} OF {course.lessons.length}
              </span>
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to="/courses"
              style={{
                textDecoration: 'none',
                padding: '9px 16px',
                borderRadius: '12px',
                background: '#242A27',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#E4EAE6',
                fontSize: '13px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>← Course Catalog</span>
            </Link>

            <button
              onClick={handleMarkComplete}
              style={{
                padding: '9px 18px',
                borderRadius: '12px',
                background: isCompleted ? '#7CA992' : '#242A27',
                border: isCompleted ? '1px solid #7CA992' : '1px solid rgba(124, 169, 146, 0.35)',
                color: isCompleted ? '#191C1A' : '#7CA992',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <span>{isCompleted ? '✓ Completed' : 'Mark Complete'}</span>
            </button>
          </div>
        </div>

        {/* ================= MAIN SPLIT-SCREEN WORKSPACE ================= */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)', gap: '28px', alignItems: 'start' }}>
          
          {/* ================= LEFT SIDE: DYNAMIC DICTIONARY ENGINE & CONTROLS ================= */}
          <div>
            
            {/* Dynamic Dictionary Input Hero Box */}
            <div
              style={{
                padding: '24px',
                borderRadius: '20px',
                background: '#242A27',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#7CA992' }}>
                  🌿 DYNAMIC 3D DICTIONARY & FINGERSPELLING ENGINE
                </span>
                <span style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '600' }}>
                  Auto-maps words or fingerspells letter-by-letter
                </span>
              </div>

              {/* Dynamic Search/Type Input Row */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <input
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && playWordOrFingerspell(typedInput)}
                  placeholder="Type any word or name to sign..."
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    borderRadius: '12px',
                    backgroundColor: '#191C1A',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#E4EAE6',
                    fontSize: '15px',
                    fontWeight: '600',
                    outline: 'none',
                    letterSpacing: '0.3px'
                  }}
                />

                <button
                  onClick={() => playWordOrFingerspell(typedInput)}
                  disabled={isPlaying || !typedInput.trim()}
                  style={{
                    padding: '14px 22px',
                    borderRadius: '12px',
                    border: '1px solid #7CA992',
                    background: '#7CA992',
                    color: '#191C1A',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: isPlaying ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{isPlaying ? 'Signing...' : 'Translate ➔'}</span>
                </button>
              </div>

              {/* Quick Sample Word Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
                <span style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '700' }}>Instant Words:</span>
                {[lesson.word, 'HELLO', 'APPLE', 'FRIEND', 'DOCTOR', 'SIGNVERSE'].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTypedInput(chip);
                      playWordOrFingerspell(chip);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: typedInput.toUpperCase() === chip ? '#7CA992' : '#191C1A',
                      color: typedInput.toUpperCase() === chip ? '#191C1A' : '#E4EAE6',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Current Token Playing Indicator */}
              <div
                style={{
                  background: '#191C1A',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '800', textTransform: 'uppercase' }}>
                    {activeTokenSub}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#E4EAE6', letterSpacing: '-0.5px', marginTop: '2px' }}>
                    {activeTokenLabel}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '4px 12px',
                      borderRadius: '10px',
                      background: matchStatus === 'direct' ? 'rgba(124, 169, 146, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: matchStatus === 'direct' ? '#7CA992' : '#fbbf24',
                      border: `1px solid ${matchStatus === 'direct' ? 'rgba(124, 169, 146, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }}
                  >
                    {matchStatus === 'direct' ? '✓ Standard 3D Sign' : '🔤 Manual Fingerspelling'}
                  </span>
                </div>
              </div>

              {/* Sequential Letter Chain for Fingerspelling */}
              {activeFingerspellTokens.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '700', marginBottom: '6px' }}>
                    FINGERSPELLING PROGRESSION:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {activeFingerspellTokens.map((char, i) => {
                      const isCurrentChar = activeTokenIndex === i;
                      const isPastChar = activeTokenIndex > i;
                      return (
                        <div
                          key={i}
                          style={{
                            width: '32px',
                            height: '36px',
                            borderRadius: '8px',
                            background: isCurrentChar ? '#7CA992' : isPastChar ? 'rgba(124, 169, 146, 0.2)' : '#191C1A',
                            color: isCurrentChar ? '#191C1A' : '#E4EAE6',
                            fontWeight: '800',
                            fontSize: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: isCurrentChar ? '2px solid #7CA992' : '1px solid rgba(255, 255, 255, 0.08)',
                            transform: isCurrentChar ? 'scale(1.1)' : 'scale(1)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {char}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Module Lesson Playlist */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#9CAEA4', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
                Module Lessons in this Track:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {course.lessons.map((item, idx) => {
                  const isCurrent = item.id === lesson.id;
                  const isLockedItem = (course.isLocked || item.isLocked) && !isPro;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (isLockedItem) {
                          setIsPaywallOpen(true);
                        } else {
                          navigate(`/courses/text-to-sign/${course.id}/${item.id}`);
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: isCurrent ? '#7CA992' : isLockedItem ? 'rgba(245, 158, 11, 0.1)' : '#242A27',
                        border: isCurrent ? '1px solid #7CA992' : isLockedItem ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isCurrent ? '#191C1A' : isLockedItem ? '#fbbf24' : '#E4EAE6',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{isLockedItem ? '🔒' : `${idx + 1}.`}</span>
                      <span>{item.word}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gesture Anatomical Instructions */}
            <div
              style={{
                padding: '22px',
                borderRadius: '18px',
                background: '#242A27',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '24px'
              }}
            >
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '800', color: '#E4EAE6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🖐️ Sign Anatomy & Motion Guide</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', lineHeight: '1.6' }}>
                <div>
                  <strong style={{ color: '#7CA992' }}>Handshape:</strong>{' '}
                  <span style={{ color: '#E4EAE6' }}>{lesson.handShape || 'Dynamic spatial orientation'}</span>
                </div>
                <div>
                  <strong style={{ color: '#7CA992' }}>Summary:</strong>{' '}
                  <span style={{ color: '#9CAEA4' }}>{lesson.summary || 'Observe hand positioning and knuckle elevation.'}</span>
                </div>
                <div>
                  <strong style={{ color: '#7CA992' }}>Phonetic Notation:</strong>{' '}
                  <span style={{ color: '#fbbf24' }}>{lesson.phonetic || '/--/'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDE: 3D WEBGL AVATAR RENDERER ================= */}
          <div>
            <div
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#242A27',
                position: 'relative'
              }}
            >
              {/* Avatar Top Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 20px',
                  backgroundColor: '#191C1A',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: isPlaying ? '#7CA992' : '#9CAEA4'
                    }}
                  />
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#E4EAE6' }}>
                    3D Avatar: Luna (WebGL)
                  </span>
                  {isPlaying && (
                    <span style={{ fontSize: '11px', background: 'rgba(124, 169, 146, 0.15)', color: '#7CA992', padding: '2px 8px', borderRadius: '8px', fontWeight: '700' }}>
                      Active
                    </span>
                  )}
                </div>

                {/* Speed Controls */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: '0.75x', val: 0.75 },
                    { label: '1.0x', val: 1.0 },
                    { label: '1.5x', val: 1.5 }
                  ].map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setSpeedMultiplier(s.val)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: speedMultiplier === s.val ? '#7CA992' : '#242A27',
                        color: speedMultiplier === s.val ? '#191C1A' : '#9CAEA4',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Iframe Viewport Container */}
              <div style={{ width: '100%', height: '480px', position: 'relative', backgroundColor: '#191C1A' }}>
                <iframe
                  ref={iframeRef}
                  src="/player-applet.html"
                  title="3D Sign Avatar"
                  onLoad={handleIframeLoad}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block'
                  }}
                />

                {!isIframeLoaded && !isLessonLocked && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#191C1A',
                      gap: '12px',
                      zIndex: 10
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '3px solid #7CA992',
                        borderTopColor: 'transparent',
                        animation: 'spin 0.8s linear infinite'
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#9CAEA4', fontWeight: '600' }}>
                      Initializing 3D Avatar Engine...
                    </span>
                  </div>
                )}

                {/* Paywall Overlay if user navigated to a locked module */}
                {isLessonLocked && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(25, 28, 26, 0.94)',
                      backdropFilter: 'blur(12px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '24px',
                      textAlign: 'center',
                      zIndex: 20
                    }}
                  >
                    <div style={{ fontSize: '42px', marginBottom: '10px' }}>🔒</div>
                    <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0', color: '#E4EAE6' }}>
                      Pro Module Locked
                    </h3>
                    <p style={{ fontSize: '13.5px', color: '#9CAEA4', maxWidth: '340px', margin: '0 0 20px 0' }}>
                      This masterclass module ({course.title}) is reserved for SignVerse Pro members.
                    </p>
                    <button
                      onClick={() => setIsPaywallOpen(true)}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#7CA992',
                        color: '#191C1A',
                        fontSize: '14px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      Unlock Pro Now (₹199) ➔
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar Bottom Bar with Playback Controls */}
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: '#191C1A',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <button
                  onClick={() => playWordOrFingerspell(typedInput)}
                  disabled={isPlaying}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#7CA992',
                    color: '#191C1A',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: isPlaying ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🔄 Replay Gesture</span>
                </button>

                <button
                  onClick={handleNextLesson}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: '#242A27',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#E4EAE6',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Next Lesson ➔</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Celebration Toast */}
      {showCelebration && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#242A27',
            border: '1px solid #7CA992',
            color: '#E4EAE6',
            padding: '14px 22px',
            borderRadius: '14px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '700'
          }}
        >
          <span>🌿</span>
          <span>Lesson marked as completed! (+{lesson.xp} XP)</span>
        </div>
      )}

      {/* Paywall Modal */}
      <UnlockProModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onUnlocked={() => {
          setIsPro(true);
        }}
        targetModuleName={course.title}
      />
    </div>
  );
}
