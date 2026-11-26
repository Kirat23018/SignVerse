import React, { useState, useEffect } from 'react';
import CourseRoadmap from '../components/CourseRoadmap';
import LessonEngine from '../components/LessonEngine';
import ProgressBar from '../components/ProgressBar';
import courseData from '../data/courseData.json';

const STORAGE_ACTIVE_LEVEL = 'signverse_active_level_id';
const STORAGE_ACTIVE_LESSON = 'signverse_active_lesson_index';

export default function CoursePage() {
  const [activeLevel, setActiveLevel] = useState(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completionBanner, setCompletionBanner] = useState('');

  // 1. Initialization: Restore active level & lesson index from localStorage on mount
  useEffect(() => {
    try {
      const savedLevelId = localStorage.getItem(STORAGE_ACTIVE_LEVEL);
      const savedLessonIndex = localStorage.getItem(STORAGE_ACTIVE_LESSON);

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
    } catch (err) {
      console.warn('[CoursePage] Could not restore saved course state from localStorage:', err);
    }
  }, []);

  // 2. State Tracking: Persist active level and lesson index whenever they change
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
      console.warn('[CoursePage] Could not persist course state to localStorage:', err);
    }
  }, [activeLevel, currentLessonIndex]);

  // Handle Level Selection from Roadmap
  const handleLevelSelect = (level) => {
    setActiveLevel(level);
    setCurrentLessonIndex(0);
  };

  // Return to Roadmap
  const handleBackToRoadmap = () => {
    setActiveLevel(null);
    setCurrentLessonIndex(0);
    localStorage.removeItem(STORAGE_ACTIVE_LEVEL);
    localStorage.removeItem(STORAGE_ACTIVE_LESSON);
  };

  // 3. Next Lesson Handler with accessible completion banner
  const handleNextLesson = () => {
    if (!activeLevel) return;

    if (currentLessonIndex + 1 < activeLevel.lessons.length) {
      setCurrentLessonIndex((prev) => prev + 1);
    } else {
      setCompletionBanner(`Completed all lessons in ${activeLevel.title}!`);
      localStorage.removeItem(STORAGE_ACTIVE_LEVEL);
      localStorage.removeItem(STORAGE_ACTIVE_LESSON);
      setCurrentLessonIndex(0);
      setActiveLevel(null);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 65px)',
        backgroundColor: '#191C1A',
        color: '#E4EAE6',
        transition: 'all 0.3s ease-in-out'
      }}
    >
      {completionBanner && (
        <div
          role="status"
          aria-live="polite"
          style={{
            maxWidth: '1200px',
            margin: '0 auto 12px',
            padding: '12px 18px',
            backgroundColor: 'rgba(124,169,146,0.16)',
            border: '1px solid #7CA992',
            borderRadius: '12px',
            color: '#A3CBB7',
            fontWeight: '700',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{completionBanner}</span>
          <button
            type="button"
            onClick={() => setCompletionBanner('')}
            style={{ background: 'transparent', border: 'none', color: '#E4EAE6', cursor: 'pointer', fontWeight: '800' }}
          >
            Dismiss
          </button>
        </div>
      )}
      <style>{`
        @keyframes courseFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .course-page-transition {
          animation: courseFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {!activeLevel ? (
        // VIEW 1: Roadmap View
        <div className="course-page-transition">
          <CourseRoadmap
            onLevelSelect={handleLevelSelect}
            onSelectLevel={handleLevelSelect}
          />
        </div>
      ) : (
        // VIEW 2: Active Lesson View
        <div className="course-page-transition" style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
          {/* Top Bar with "Back to Roadmap" Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              backgroundColor: '#242A27',
              borderRadius: '16px',
              marginBottom: '10px',
              border: '1px solid #3A443F',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <button
              type="button"
              onClick={handleBackToRoadmap}
              style={{
                backgroundColor: '#191C1A',
                border: '1px solid #3A443F',
                padding: '8px 18px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                color: '#E4EAE6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span aria-hidden="true">←</span>
              <span>Back to Roadmap</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  backgroundColor: 'rgba(124,169,146,0.18)',
                  color: '#A3CBB7',
                  border: '1px solid rgba(124,169,146,0.35)',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 10px',
                  borderRadius: '10px',
                  textTransform: 'uppercase'
                }}
              >
                {activeLevel.badge || 'Level Active'}
              </span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#E4EAE6' }}>
                {activeLevel.title}
              </span>
            </div>
          </div>

          {/* Gamified Progress Bar placed right below Back to Roadmap */}
          <ProgressBar
            currentStep={currentLessonIndex}
            totalSteps={activeLevel.lessons?.length || 1}
          />

          {/* Lesson Engine Container */}
          <LessonEngine
            lesson={activeLevel.lessons && activeLevel.lessons[currentLessonIndex]}
            levelData={activeLevel}
            currentLessonIndex={currentLessonIndex}
            onNextLesson={handleNextLesson}
            onBack={handleBackToRoadmap}
          />
        </div>
      )}
    </div>
  );
}
