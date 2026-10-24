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

  // 3. Next Lesson Handler with completion alert and persistence cleanup
  const handleNextLesson = () => {
    if (!activeLevel) return;

    if (currentLessonIndex + 1 < activeLevel.lessons.length) {
      setCurrentLessonIndex((prev) => prev + 1);
    } else {
      // Completed last lesson of level
      alert(`🎉 Outstanding! You completed all lessons in ${activeLevel.title}! Returning to the Roadmap.`);
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
        backgroundColor: '#f8fafc',
        transition: 'all 0.3s ease-in-out'
      }}
    >
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
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              marginBottom: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <button
              onClick={handleBackToRoadmap}
              style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '8px 18px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                color: '#1e293b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            >
              <span>←</span>
              <span>Back to Roadmap</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  backgroundColor: activeLevel.color || '#3b82f6',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 10px',
                  borderRadius: '10px',
                  textTransform: 'uppercase'
                }}
              >
                {activeLevel.badge || 'Level Active'}
              </span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
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
