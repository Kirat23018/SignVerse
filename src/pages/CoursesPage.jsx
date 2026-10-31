import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LessonEngine from '../components/LessonEngine';
import courseData from '../data/courseData.json';
import { getSubscriptionStatus } from '../utils/subscriptionManager';

const STORAGE_ACTIVE_LEVEL = 'signverse_active_level_id';
const STORAGE_ACTIVE_LESSON = 'signverse_active_lesson_index';
const STORAGE_ENROLLED_LEVELS = 'signverse_enrolled_levels';

export default function CoursesPage() {
  const [activeLevel, setActiveLevel] = useState(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [enrolledLevels, setEnrolledLevels] = useState(['level-1']);
  const [subStatus, setSubStatus] = useState(getSubscriptionStatus());

  // Restore active lesson & enrollments from localStorage
  useEffect(() => {
    try {
      const savedLevelId = localStorage.getItem(STORAGE_ACTIVE_LEVEL);
      const savedLessonIndex = localStorage.getItem(STORAGE_ACTIVE_LESSON);
      const savedEnrolled = localStorage.getItem(STORAGE_ENROLLED_LEVELS);

      if (savedEnrolled) {
        setEnrolledLevels(JSON.parse(savedEnrolled));
      }

      if (savedLevelId) {
        const found = courseData.find((lvl) => lvl.id === savedLevelId);
        if (found) {
          setActiveLevel(found);
          if (savedLessonIndex !== null) {
            const idx = parseInt(savedLessonIndex, 10);
            if (!isNaN(idx) && idx >= 0 && idx < found.lessons.length) {
              setCurrentLessonIndex(idx);
            }
          }
        }
      }
      setSubStatus(getSubscriptionStatus());
    } catch (err) {
      console.warn('Error loading course state:', err);
    }
  }, []);

  // Save active level to localStorage
  useEffect(() => {
    try {
      if (activeLevel) {
        localStorage.setItem(STORAGE_ACTIVE_LEVEL, activeLevel.id);
        localStorage.setItem(STORAGE_ACTIVE_LESSON, String(currentLessonIndex));
      } else {
        localStorage.removeItem(STORAGE_ACTIVE_LEVEL);
        localStorage.removeItem(STORAGE_ACTIVE_LESSON);
      }
    } catch (err) {
      console.warn('Error persisting course state:', err);
    }
  }, [activeLevel, currentLessonIndex]);

  // Handle Enrollment
  const handleEnroll = (levelId) => {
    const updated = Array.from(new Set([...enrolledLevels, levelId]));
    setEnrolledLevels(updated);
    localStorage.setItem(STORAGE_ENROLLED_LEVELS, JSON.stringify(updated));
  };

  // Launch a level
  const handleStartLevel = (level) => {
    handleEnroll(level.id);
    setActiveLevel(level);
    setCurrentLessonIndex(0);
  };

  // Return to Catalog
  const handleBackToCatalog = () => {
    setActiveLevel(null);
    setCurrentLessonIndex(0);
    localStorage.removeItem(STORAGE_ACTIVE_LEVEL);
    localStorage.removeItem(STORAGE_ACTIVE_LESSON);
  };

  // Next lesson
  const handleNextLesson = () => {
    if (!activeLevel) return;
    if (currentLessonIndex + 1 < activeLevel.lessons.length) {
      setCurrentLessonIndex((prev) => prev + 1);
    } else {
      alert(`🎉 Outstanding! You completed all lessons in ${activeLevel.title}!`);
      handleBackToCatalog();
    }
  };

  // Filter courses by category
  const filteredCourses = courseData.filter((course) => {
    if (selectedCategory === 'free') return !course.isPremium;
    if (selectedCategory === 'premium') return course.isPremium;
    return true;
  });

  // If a level is active, display the LessonEngine view
  if (activeLevel) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#1e1e1e', color: '#ffffff', padding: '20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button
              onClick={handleBackToCatalog}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>← Back to Course Catalog</span>
            </button>

            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700' }}>
              Lesson {currentLessonIndex + 1} of {activeLevel.lessons.length}
            </span>
          </div>

          <LessonEngine
            level={activeLevel}
            currentLessonIndex={currentLessonIndex}
            onNextLesson={handleNextLesson}
            onBackToRoadmap={handleBackToCatalog}
          />
        </div>
      </div>
    );
  }

  // Catalog View
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 56px)',
        backgroundColor: '#1e1e1e',
        color: '#f8fafc',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '36px 20px 80px',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* Ambient background glows */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '15%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '10%',
          right: '10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* Breadcrumb & Header */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', color: '#94a3b8' }}>
            <Link to="/" style={{ color: '#10b981', textDecoration: 'none', fontWeight: '600' }}>Home</Link>
            <span>/</span>
            <span style={{ color: '#cbd5e1' }}>Academy & Courses</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
                <span>🎯 GAMIFIED SIGN LANGUAGE ACADEMY</span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '900', margin: 0, color: '#ffffff', letterSpacing: '-0.8px' }}>
                Sign Language <span style={{ background: 'linear-gradient(135deg, #10b981, #6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Modules</span>
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: '15.5px', color: '#94a3b8', maxWidth: '680px', lineHeight: '1.6' }}>
                Browse structured, interactive curriculums. Drag-and-drop fingerspelling, visual grocery selections, multi-avatar challenges, and earn XP rewards.
              </p>
            </div>

            {/* Trial & XP Pill */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '10px 18px',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Plan Status</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#10b981' }}>
                  {subStatus.isPaidPlan ? 'Pro ✨' : `Trial (${subStatus.trialDaysRemaining}d)`}
                </div>
              </div>
              <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Credits</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#facc15' }}>🪙 {subStatus.credits}</div>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '28px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Modules' },
              { id: 'free', label: '🌱 Free Tier' },
              { id: 'premium', label: '💎 Premium Track' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                style={{
                  background: selectedCategory === tab.id ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(35, 35, 35, 0.75)',
                  color: selectedCategory === tab.id ? '#ffffff' : '#94a3b8',
                  border: selectedCategory === tab.id ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  backdropFilter: 'blur(12px)',
                  boxShadow: selectedCategory === tab.id ? '0 4px 14px rgba(16, 185, 129, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= PINTEREST-STYLE COURSE CARDS GRID ================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '26px'
          }}
        >
          {filteredCourses.map((level) => {
            const isEnrolled = enrolledLevels.includes(level.id);
            const totalLessons = level.lessons.length;

            return (
              <div
                key={level.id}
                style={{
                  background: 'rgba(30, 30, 30, 0.75)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '26px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
                  transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = level.accentColor || 'rgba(56, 189, 248, 0.4)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.3)';
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: level.accentColor || '#10b981',
                        border: `1px solid ${level.accentColor ? `${level.accentColor}40` : 'rgba(16, 185, 129, 0.3)'}`
                      }}
                    >
                      {level.badge}
                    </span>

                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#facc15', background: 'rgba(250, 204, 21, 0.1)', padding: '3px 9px', borderRadius: '10px', border: '1px solid rgba(250, 204, 21, 0.2)' }}>
                      🏆 +{level.xpReward} XP
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '21px', fontWeight: '800', color: '#ffffff' }}>
                    {level.title}
                  </h3>

                  <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#94a3b8', lineHeight: '1.6' }}>
                    {level.description}
                  </p>

                  {/* Lessons Preview List */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#64748b', marginBottom: '10px' }}>
                      INCLUDED CHALLENGES ({totalLessons} LESSONS)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {level.lessons.map((lesson, idx) => (
                        <div
                          key={lesson.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            fontSize: '12.5px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>#{idx + 1}</span>
                            <span style={{ fontWeight: '600', color: '#e2e8f0' }}>{lesson.title}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>
                            {lesson.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Section */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <button
                    onClick={() => handleStartLevel(level)}
                    style={{
                      width: '100%',
                      padding: '13px 20px',
                      borderRadius: '16px',
                      background: level.isPremium
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: level.isPremium
                        ? '0 6px 18px rgba(245, 158, 11, 0.3)'
                        : '0 6px 18px rgba(16, 185, 129, 0.3)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <span>{isEnrolled ? 'Resume Module ➔' : 'Enroll & Start Learning ➔'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
