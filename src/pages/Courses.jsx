import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSubscriptionStatus, isProUnlocked } from '../utils/subscriptionManager';
import { TEXT_TO_SIGN_TRACK, SIGN_TO_TEXT_TRACK } from '../data/dualTrackCourses';
import UnlockProModal from '../components/UnlockProModal';

const STORAGE_ENROLLED_COURSES = 'signverse_enrolled_courses';
const STORAGE_COMPLETED_LESSONS = 'signverse_completed_lessons';

export default function Courses() {
  const navigate = useNavigate();
  // Dual-Track Toggle state: 'text-to-sign' | 'sign-to-text'
  const [activeTrack, setActiveTrack] = useState('text-to-sign');
  const [enrolledCourses, setEnrolledCourses] = useState(['tts-mod-1', 'stt-mod-1']);
  const [completedLessons, setCompletedLessons] = useState(['tts-l1-1']);
  const [subStatus, setSubStatus] = useState(getSubscriptionStatus());
  const [isPro, setIsPro] = useState(isProUnlocked());
  const [expandedCourseId, setExpandedCourseId] = useState('tts-mod-1');

  // Paywall Modal State
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [targetModuleName, setTargetModuleName] = useState('');

  const syncStatus = () => {
    try {
      const savedEnrolled = localStorage.getItem(STORAGE_ENROLLED_COURSES);
      if (savedEnrolled) setEnrolledCourses(JSON.parse(savedEnrolled));

      const savedCompleted = localStorage.getItem(STORAGE_COMPLETED_LESSONS);
      if (savedCompleted) setCompletedLessons(JSON.parse(savedCompleted));

      setSubStatus(getSubscriptionStatus());
      setIsPro(isProUnlocked());
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  };

  useEffect(() => {
    syncStatus();
    const handleSubUpdate = () => syncStatus();
    window.addEventListener('signverse_subscription_updated', handleSubUpdate);
    return () => window.removeEventListener('signverse_subscription_updated', handleSubUpdate);
  }, []);

  const handleEnroll = (courseId) => {
    const updated = Array.from(new Set([...enrolledCourses, courseId]));
    setEnrolledCourses(updated);
    localStorage.setItem(STORAGE_ENROLLED_COURSES, JSON.stringify(updated));
  };

  const handleModuleClick = (module, targetRoute) => {
    const isLocked = module.isLocked && !isPro;
    if (isLocked) {
      setTargetModuleName(`${module.title} (Level ${module.number})`);
      setIsPaywallOpen(true);
      return;
    }

    handleEnroll(module.id);
    if (targetRoute) {
      navigate(targetRoute);
    } else {
      setExpandedCourseId(expandedCourseId === module.id ? null : module.id);
    }
  };

  const currentModules = activeTrack === 'text-to-sign' ? TEXT_TO_SIGN_TRACK : SIGN_TO_TEXT_TRACK;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#191C1A',
        color: '#E4EAE6',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '36px 20px 80px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* Header Breadcrumb & Title */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px', color: '#9CAEA4' }}>
            <Link to="/" style={{ color: '#7CA992', textDecoration: 'none', fontWeight: '700' }}>Home</Link>
            <span>/</span>
            <span style={{ color: '#E4EAE6' }}>Academy Courses</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(124, 169, 146, 0.14)', border: '1px solid rgba(124, 169, 146, 0.28)', color: '#7CA992', fontSize: '12px', fontWeight: '800', marginBottom: '12px' }}>
                <span>🎯 DUAL-TRACK SIGN LANGUAGE CURRICULUM</span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '900', margin: 0, letterSpacing: '-0.8px', color: '#E4EAE6' }}>
                SignVerse <span style={{ color: '#7CA992' }}>Academy</span>
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: '15.5px', color: '#9CAEA4', maxWidth: '720px', lineHeight: '1.6' }}>
                Master sign language through two parallel paths: <strong>3D Avatar Gestures</strong> (Text-to-Sign) and <strong>Real-Time Camera AI</strong> (Sign-to-Text).
                Lessons 1 to 5 are completely free; Lessons 6 to 15 unlock with Pro.
              </p>
            </div>

            {/* Pro Status / Unlock Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#242A27',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '12px 20px',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#9CAEA4', textTransform: 'uppercase', fontWeight: '800' }}>Membership Tier</div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: isPro ? '#7CA992' : '#d4a373' }}>
                  {isPro ? (subStatus?.planName || '👑 Pro All-Access') : '🌱 Freemium (L1-5 Free)'}
                </div>
              </div>

              {!isPro && (
                <button
                  onClick={() => {
                    setTargetModuleName('SignVerse Pro All-Access');
                    setIsPaywallOpen(true);
                  }}
                  style={{
                    backgroundColor: '#7CA992',
                    color: '#191C1A',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6c9882'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7CA992'}
                >
                  Unlock Pro (₹199) ⚡
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dual-Track Toggle Switch Bar */}
        <div
          style={{
            display: 'flex',
            background: '#242A27',
            padding: '6px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '32px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            maxWidth: '680px'
          }}
        >
          <button
            onClick={() => {
              setActiveTrack('text-to-sign');
              setExpandedCourseId('tts-mod-1');
            }}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '16px',
              border: 'none',
              background: activeTrack === 'text-to-sign' ? '#7CA992' : 'transparent',
              color: activeTrack === 'text-to-sign' ? '#191C1A' : '#9CAEA4',
              fontSize: '14.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '18px' }}>🗣️</span>
            <span>Track 1: Text-to-Sign (3D Avatar)</span>
            <span style={{ fontSize: '11px', background: activeTrack === 'text-to-sign' ? 'rgba(25, 28, 26, 0.2)' : 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px' }}>
              15 Modules
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTrack('sign-to-text');
              setExpandedCourseId('stt-mod-1');
            }}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '16px',
              border: 'none',
              background: activeTrack === 'sign-to-text' ? '#7CA992' : 'transparent',
              color: activeTrack === 'sign-to-text' ? '#191C1A' : '#9CAEA4',
              fontSize: '14.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '18px' }}>📷</span>
            <span>Track 2: Sign-to-Text (Webcam AI)</span>
            <span style={{ fontSize: '11px', background: activeTrack === 'sign-to-text' ? 'rgba(25, 28, 26, 0.2)' : 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px' }}>
              15 Modules
            </span>
          </button>
        </div>

        {/* Track Overview Card */}
        <div
          style={{
            background: 'rgba(36, 42, 39, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '20px 24px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{activeTrack === 'text-to-sign' ? '💡' : '⚡'}</span>
            <span style={{ fontSize: '13.5px', color: '#E4EAE6' }}>
              {activeTrack === 'text-to-sign' ? (
                <>
                  Showing <strong>15 WebGL Avatar modules</strong>. Type any word in the dynamic dictionary or follow structured fingerspelling & dialog lessons.
                </>
              ) : (
                <>
                  Showing <strong>15 Computer Vision modules</strong>. Practice the 5 core signs (Yes, One, Victory, Rock, Stop) with dynamic target validation in <strong>LiveCam</strong>.
                </>
              )}
            </span>
          </div>

          <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#7CA992' }}>
            Freemium Active • Modules 1–5 Free (100%) • Modules 6–15 Pro
          </div>
        </div>

        {/* Modules Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {currentModules.map((module) => {
            const isModuleLocked = module.isLocked && !isPro;
            const isExpanded = expandedCourseId === module.id;

            return (
              <div
                key={module.id}
                style={{
                  background: isModuleLocked ? 'rgba(36, 42, 39, 0.55)' : '#242A27',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: isExpanded ? '1px solid rgba(124, 169, 146, 0.45)' : isModuleLocked ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Module Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '16px',
                        background: isModuleLocked ? 'rgba(255, 255, 255, 0.04)' : 'rgba(124, 169, 146, 0.16)',
                        border: isModuleLocked ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(124, 169, 146, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '26px'
                      }}
                    >
                      {isModuleLocked ? '🔒' : module.icon}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            background: isModuleLocked ? 'rgba(212, 163, 115, 0.18)' : 'rgba(124, 169, 146, 0.18)',
                            color: isModuleLocked ? '#d4a373' : '#7CA992',
                            border: `1px solid ${isModuleLocked ? 'rgba(212, 163, 115, 0.35)' : 'rgba(124, 169, 146, 0.35)'}`
                          }}
                        >
                          {isModuleLocked ? '🔒 PRO REQUIRED' : '🌱 FREE TIER'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#9CAEA4' }}>• Module {module.number} of 15</span>
                        <span style={{ fontSize: '12px', color: '#9CAEA4' }}>• ⏱️ {module.duration}</span>
                        <span style={{ fontSize: '12px', color: '#7CA992', fontWeight: '700' }}>• +{module.xp} XP</span>
                      </div>

                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#E4EAE6' }}>
                        {module.title}
                      </h3>
                      <div style={{ fontSize: '13.5px', color: '#9CAEA4', marginTop: '3px' }}>
                        {module.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={() => setExpandedCourseId(isExpanded ? null : module.id)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#E4EAE6',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isExpanded ? 'Hide Details ▲' : 'View Lessons ▼'}
                    </button>

                    {isModuleLocked ? (
                      <button
                        onClick={() => handleModuleClick(module)}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '12px',
                          background: 'rgba(212, 163, 115, 0.2)',
                          color: '#d4a373',
                          border: '1px solid rgba(212, 163, 115, 0.35)',
                          fontSize: '13px',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span>🔒 Unlock Pro (₹199)</span>
                      </button>
                    ) : activeTrack === 'text-to-sign' ? (
                      <button
                        onClick={() => handleModuleClick(module, `/courses/text-to-sign/${module.id}/lesson-1`)}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '12px',
                          background: '#7CA992',
                          color: '#191C1A',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span>Launch 3D Lesson ➔</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const firstTarget = module.drills?.[0]?.target || 'Yes';
                          handleModuleClick(module, `/sign-to-text?module=${module.id}&target=${encodeURIComponent(firstTarget)}`);
                        }}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '12px',
                          background: '#7CA992',
                          color: '#191C1A',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span>Practice in LiveCam 📷</span>
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#9CAEA4', lineHeight: '1.6' }}>
                  {module.description}
                </p>

                {/* Covered Signs Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: isExpanded ? '18px' : '0' }}>
                  <span style={{ fontSize: '12px', color: '#9CAEA4', fontWeight: '700' }}>Target Vocabulary:</span>
                  {(module.targetWords || module.targetSigns || []).map((term, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        color: '#E4EAE6',
                        fontWeight: '600'
                      }}
                    >
                      {term}
                    </span>
                  ))}
                </div>

                {/* Expandable Lessons / Drills List */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '18px',
                      paddingTop: '18px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#7CA992', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
                      {activeTrack === 'text-to-sign' ? 'Interactive 3D Avatar Lessons' : 'Live Camera Detection Drills'}
                    </div>

                    {(module.lessons || module.drills || []).map((item, idx) => {
                      const isComplete = completedLessons.includes(item.id);
                      const isItemLocked = (module.isLocked || item.isLocked) && !isPro;

                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: isItemLocked ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: isItemLocked ? 'rgba(212, 163, 115, 0.18)' : isComplete ? '#7CA992' : 'rgba(255, 255, 255, 0.06)',
                                color: isItemLocked ? '#d4a373' : isComplete ? '#191C1A' : '#E4EAE6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '800'
                              }}
                            >
                              {isItemLocked ? '🔒' : isComplete ? '✓' : idx + 1}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: '#E4EAE6' }}>
                                {item.title}
                              </div>
                              <div style={{ fontSize: '12px', color: '#9CAEA4' }}>
                                Target: <span style={{ color: '#7CA992', fontWeight: '700' }}>{item.word || item.target}</span> • +{item.xp} XP • {item.duration || '4 mins'}
                              </div>
                            </div>
                          </div>

                          <div>
                            {isItemLocked ? (
                              <button
                                onClick={() => handleModuleClick(module)}
                                style={{
                                  padding: '7px 14px',
                                  borderRadius: '10px',
                                  background: 'rgba(212, 163, 115, 0.14)',
                                  border: '1px solid rgba(212, 163, 115, 0.3)',
                                  color: '#d4a373',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                🔒 Unlock Pro (₹199)
                              </button>
                            ) : activeTrack === 'text-to-sign' ? (
                              <Link
                                to={`/courses/text-to-sign/${module.id}/lesson-${idx + 1}`}
                                style={{
                                  textDecoration: 'none',
                                  padding: '7px 14px',
                                  borderRadius: '10px',
                                  background: 'rgba(124, 169, 146, 0.16)',
                                  border: '1px solid rgba(124, 169, 146, 0.3)',
                                  color: '#7CA992',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>Launch 3D Lesson</span>
                                <span>➔</span>
                              </Link>
                            ) : (
                              <Link
                                to={`/sign-to-text?module=${module.id}&drill=${item.id}&target=${encodeURIComponent(item.target)}`}
                                style={{
                                  textDecoration: 'none',
                                  padding: '7px 14px',
                                  borderRadius: '10px',
                                  background: 'rgba(124, 169, 146, 0.16)',
                                  border: '1px solid rgba(124, 169, 146, 0.3)',
                                  color: '#7CA992',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <span>Start Camera Drill</span>
                                <span>📷</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium Unlock Modal Overlay */}
      <UnlockProModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onUnlocked={() => {
          syncStatus();
        }}
        targetModuleName={targetModuleName}
      />
    </div>
  );
}
