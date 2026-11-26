import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getStreak } from '../utils/streakManager';
import { TEXT_TO_SIGN_TRACK, SIGN_TO_TEXT_TRACK } from '../data/dualTrackCourses';

const SAFE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024;

function readJsonArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getRankData(xp) {
  if (xp >= 3500) {
    return {
      rank: 'Sign Master',
      icon: '👑',
      tierMin: 3500,
      tierMax: 5000,
      nextRank: 'Max Tier Reached',
      percent: Math.min(100, Math.round(((xp - 3500) / 1500) * 100)),
      remaining: 0,
      tierLevel: 'Level 5'
    };
  }
  if (xp >= 2200) {
    return {
      rank: 'Emerald Master',
      icon: '💎',
      tierMin: 2200,
      tierMax: 3500,
      nextRank: 'Sign Master',
      percent: Math.round(((xp - 2200) / (3500 - 2200)) * 100),
      remaining: 3500 - xp,
      tierLevel: 'Level 4'
    };
  }
  if (xp >= 1200) {
    return {
      rank: 'Adept',
      icon: '🌲',
      tierMin: 1200,
      tierMax: 2200,
      nextRank: 'Emerald Master',
      percent: Math.round(((xp - 1200) / (2200 - 1200)) * 100),
      remaining: 2200 - xp,
      tierLevel: 'Level 3'
    };
  }
  if (xp >= 500) {
    return {
      rank: 'Apprentice',
      icon: '🌿',
      tierMin: 500,
      tierMax: 1200,
      nextRank: 'Adept',
      percent: Math.round(((xp - 500) / (1200 - 500)) * 100),
      remaining: 1200 - xp,
      tierLevel: 'Level 2'
    };
  }
  return {
    rank: 'Novice',
    icon: '🌱',
    tierMin: 0,
    tierMax: 500,
    nextRank: 'Apprentice',
    percent: Math.round((xp / 500) * 100),
    remaining: Math.max(0, 500 - xp),
    tierLevel: 'Level 1'
  };
}

function buildLast7DaysVolume(quizHistory, practiceHistory) {
  const days = [];
  const today = new Date();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    days.push({
      dateKey: d.toDateString(),
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count: 0,
      today: offset === 0
    });
  }

  const allSessions = [...quizHistory, ...practiceHistory];
  allSessions.forEach((rec) => {
    const ts = typeof rec.id === 'number' ? rec.id : Date.parse(rec.date || '');
    if (!Number.isFinite(ts)) return;
    const key = new Date(ts).toDateString();
    const bucket = days.find((d) => d.dateKey === key);
    if (bucket) {
      bucket.count += Number(rec.total) || 0;
    }
  });

  return days;
}

function computeResumeCourse(completedLessons) {
  const completedSet = new Set(completedLessons);
  const freeModules = TEXT_TO_SIGN_TRACK.filter((m) => !m.isLocked);

  for (const mod of freeModules) {
    const doneInMod = mod.lessons.filter((l) => completedSet.has(l.id)).length;
    const nextLesson = mod.lessons.find((l) => !completedSet.has(l.id));
    if (nextLesson) {
      return {
        moduleId: mod.id,
        moduleTitle: mod.title,
        lessonId: nextLesson.id,
        lessonTitle: nextLesson.title,
        lessonXp: nextLesson.xp,
        doneInMod,
        totalInMod: mod.lessons.length,
        percent: Math.round((doneInMod / mod.lessons.length) * 100),
        allDone: false
      };
    }
  }

  const lastFree = freeModules[freeModules.length - 1] || TEXT_TO_SIGN_TRACK[0];
  const lastLesson = lastFree.lessons[lastFree.lessons.length - 1];
  return {
    moduleId: lastFree.id,
    moduleTitle: lastFree.title,
    lessonId: lastLesson.id,
    lessonTitle: lastLesson.title,
    lessonXp: lastLesson.xp,
    doneInMod: lastFree.lessons.length,
    totalInMod: lastFree.lessons.length,
    percent: 100,
    allDone: true
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    userName: 'Learner',
    quizAccuracy: null,
    totalQuizzes: 0,
    practiceCount: 0,
    translationsCount: 0,
    completedCount: 0,
    streak: 0,
    totalXP: 0,
    quizHistory: [],
    practiceHistory: [],
    completedLessons: []
  });

  const [greeting, setGreeting] = useState('Welcome Back');
  const [userAvatarPhoto, setUserAvatarPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activityTab, setActivityTab] = useState('all'); // 'all' | 'quiz' | 'practice'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 4) setGreeting('Late Night Session');
    else if (hour >= 4 && hour < 12) setGreeting('Good Morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    try {
      const quizHistory = readJsonArray('quizHistory');
      const practiceHistory = readJsonArray('practiceHistory');
      const completedLessons = readJsonArray('signverse_completed_lessons');
      const savedPhoto = localStorage.getItem('userAvatarPhoto');
      const storedName = localStorage.getItem('userName');
      const translationsCount = parseInt(localStorage.getItem('signverse_translation_count') || '0', 10) || 0;
      const activeStreak = getStreak();

      let accuracy = null;
      let totalCorrectQuiz = 0;
      if (quizHistory.length > 0) {
        totalCorrectQuiz = quizHistory.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
        const possible = quizHistory.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
        accuracy = possible > 0 ? Number(((totalCorrectQuiz / possible) * 100).toFixed(1)) : 0;
      }

      const totalPracticed = practiceHistory.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

      // Compute lesson XP strictly from completed lessons/drills inside curriculum catalog
      const completedSet = new Set(completedLessons);
      const lessonXp = [...TEXT_TO_SIGN_TRACK, ...SIGN_TO_TEXT_TRACK]
        .flatMap((m) => m.lessons || m.drills || [])
        .filter((l) => l && completedSet.has(l.id))
        .reduce((acc, l) => acc + (Number(l.xp) || 25), 0);

      const computedXP = lessonXp + totalCorrectQuiz * 15 + totalPracticed * 5 + translationsCount * 2;

      if (savedPhoto) setUserAvatarPhoto(savedPhoto);

      setStats({
        userName: storedName && storedName.trim() ? storedName.trim() : 'Learner',
        quizAccuracy: accuracy,
        totalQuizzes: quizHistory.length,
        practiceCount: totalPracticed,
        translationsCount,
        completedCount: completedLessons.length,
        streak: activeStreak,
        totalXP: computedXP,
        quizHistory,
        practiceHistory,
        completedLessons
      });
    } catch (e) {
      console.warn('Dashboard load error:', e);
    }
  }, []);

  const rankData = getRankData(stats.totalXP);
  const resumeInfo = computeResumeCourse(stats.completedLessons);
  const weeklyData = buildLast7DaysVolume(stats.quizHistory, stats.practiceHistory);
  const weeklyTotal = weeklyData.reduce((sum, d) => sum + d.count, 0);

  // Merge chronological real activity log
  const mergedActivities = [
    ...stats.quizHistory.map((q, idx) => ({
      id: `quiz-${q.id || idx}`,
      ts: typeof q.id === 'number' ? q.id : 0,
      kind: 'quiz',
      label: 'Skill Verification Quiz',
      detail: `${q.score}/${q.total} correct`,
      pct: q.total > 0 ? Math.round((q.score / q.total) * 100) : 0,
      date: q.date || 'Recorded session',
      xpEarned: (Number(q.score) || 0) * 15
    })),
    ...stats.practiceHistory.map((p, idx) => ({
      id: `practice-${p.id || idx}`,
      ts: typeof p.id === 'number' ? p.id : 0,
      kind: 'practice',
      label: 'Flashcard Practice',
      detail: `${p.score}/${p.total} recalled`,
      pct: p.total > 0 ? Math.round((p.score / p.total) * 100) : 0,
      date: p.date || 'Recorded session',
      xpEarned: (Number(p.total) || 0) * 5
    }))
  ]
    .sort((a, b) => b.ts - a.ts)
    .filter((item) => activityTab === 'all' || item.kind === activityTab);

  // Last 7 real quizzes for SVG accuracy trajectory
  const recentQuizzesForChart = [...stats.quizHistory]
    .slice(0, 7)
    .reverse()
    .map((q, idx) => {
      const pct = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0;
      return {
        label: `Q${idx + 1}`,
        pct,
        date: q.date || ''
      };
    });

  // Real curriculum progress breakdown
  const completedSet = new Set(stats.completedLessons);
  const freeTtsLessons = TEXT_TO_SIGN_TRACK.filter((m) => !m.isLocked).flatMap((m) => m.lessons || []);
  const allTtsLessons = TEXT_TO_SIGN_TRACK.flatMap((m) => m.lessons || []);
  const allSttLessons = SIGN_TO_TEXT_TRACK.flatMap((m) => m.drills || m.lessons || []);

  const freeTtsDone = freeTtsLessons.filter((l) => l && completedSet.has(l.id)).length;
  const allTtsDone = allTtsLessons.filter((l) => l && completedSet.has(l.id)).length;
  const allSttDone = allSttLessons.filter((l) => l && completedSet.has(l.id)).length;

  const progressDomains = [
    {
      domain: 'Free 3D Avatar Modules (1-5)',
      percent: freeTtsLessons.length > 0 ? Math.round((freeTtsDone / freeTtsLessons.length) * 100) : 0,
      summary: `${freeTtsDone} / ${freeTtsLessons.length} lessons`
    },
    {
      domain: 'Full 3D Avatar Curriculum (Modules 1-15)',
      percent: allTtsLessons.length > 0 ? Math.round((allTtsDone / allTtsLessons.length) * 100) : 0,
      summary: `${allTtsDone} / ${allTtsLessons.length} lessons`
    },
    {
      domain: 'LiveCam Sign-to-Text Curriculum',
      percent: allSttLessons.length > 0 ? Math.round((allSttDone / allSttLessons.length) * 100) : 0,
      summary: `${allSttDone} / ${allSttLessons.length} drills`
    },
    {
      domain: 'Quiz Recall Accuracy',
      percent: stats.quizAccuracy !== null ? Math.round(stats.quizAccuracy) : 0,
      summary: stats.quizAccuracy !== null ? `${stats.quizAccuracy}% across ${stats.totalQuizzes} quiz(zes)` : 'No quiz attempts yet'
    }
  ];

  // Genuine milestone checks
  const milestones = [
    {
      icon: '🤟',
      title: 'First Steps in ISL',
      desc: 'Complete 1 lesson or run 1 translation',
      unlocked: stats.completedCount >= 1 || stats.translationsCount >= 1
    },
    {
      icon: '🎯',
      title: 'Quiz Qualifier',
      desc: 'Score 70%+ average accuracy across quizzes',
      unlocked: stats.totalQuizzes >= 1 && (stats.quizAccuracy ?? 0) >= 70
    },
    {
      icon: '🃏',
      title: 'Flashcard Regular',
      desc: 'Review at least 10 signs in Practice mode',
      unlocked: stats.practiceCount >= 10
    },
    {
      icon: '🔥',
      title: '5-Day Learning Streak',
      desc: 'Practice on 5 consecutive calendar days',
      unlocked: stats.streak >= 5
    }
  ];
  const unlockedMilestoneCount = milestones.filter((m) => m.unlocked).length;

  // Avatar Photo Handlers (strict type & size validation)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!SAFE_IMAGE_TYPES.includes(file.type)) {
      setUploadError('Please upload a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setUploadError('Profile image must be 1.5 MB or smaller.');
      return;
    }
    setUploadError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
        setUserAvatarPhoto(reader.result);
        try {
          localStorage.setItem('userAvatarPhoto', reader.result);
        } catch {
          setUploadError('Image is too large for browser storage.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setUploadError('Camera permission was denied or unavailable.');
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 200, 200);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setUserAvatarPhoto(dataUrl);
      try {
        localStorage.setItem('userAvatarPhoto', dataUrl);
      } catch {
        setUploadError('Image is too large for browser storage.');
      }
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 65px)',
        backgroundColor: '#191C1A',
        color: '#E4EAE6',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflowX: 'hidden',
        padding: '40px 24px 80px'
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* 1. HEADER & PROFILE */}
        <div
          style={{
            marginBottom: '36px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '24px',
            paddingBottom: '28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                aria-label="Upload profile photo"
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '26px',
                  overflow: 'hidden',
                  background: '#242A27',
                  border: '1.5px solid rgba(124, 169, 146, 0.35)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '34px',
                  cursor: 'pointer',
                  padding: 0
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Click to upload profile photo"
              >
                {userAvatarPhoto ? (
                  <img src={userAvatarPhoto} alt="User profile avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span aria-hidden="true">👤</span>
                )}
              </button>

              <button
                type="button"
                aria-label="Take profile photo with camera"
                onClick={(e) => {
                  e.stopPropagation();
                  startCamera();
                }}
                title="Take photo with camera"
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#7CA992',
                  border: '2px solid #191C1A',
                  color: '#191C1A',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2
                }}
              >
                <span aria-hidden="true">📷</span>
              </button>

              <input
                type="file"
                aria-label="Choose profile photo file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
              />
              {uploadError && (
                <div role="alert" style={{ marginTop: '6px', fontSize: '11.5px', color: '#fecaca', maxWidth: '180px' }}>
                  {uploadError}
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: '#7CA992',
                    background: 'rgba(124, 169, 146, 0.14)',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(124, 169, 146, 0.28)'
                  }}
                >
                  {rankData.icon} {rankData.rank} ({rankData.tierLevel})
                </span>
                <span style={{ fontSize: '13px', color: '#9CAEA4' }}>•</span>
                <span style={{ fontSize: '13px', color: '#9CAEA4' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(28px, 3.5vw, 40px)',
                  fontWeight: '800',
                  margin: 0,
                  letterSpacing: '-0.8px',
                  color: '#E4EAE6'
                }}
              >
                {greeting}, <span style={{ color: '#7CA992' }}>{stats.userName}</span>
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: '14.5px', color: '#9CAEA4' }}>
                Live learning metrics computed strictly from your recorded quizzes, practice drills, and completed lessons.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/text-to-sign"
              style={{
                textDecoration: 'none',
                padding: '11px 20px',
                borderRadius: '14px',
                background: 'rgba(124, 169, 146, 0.12)',
                border: '1px solid rgba(124, 169, 146, 0.25)',
                color: '#A3CBB7',
                fontSize: '13.5px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>3D Translator</span>
            </Link>

            <Link
              to="/sign-to-text"
              style={{
                textDecoration: 'none',
                padding: '11px 22px',
                borderRadius: '14px',
                background: '#7CA992',
                color: '#191C1A',
                fontSize: '13.5px',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>LiveCam Studio</span>
            </Link>
          </div>
        </div>

        {/* Camera Modal */}
        {isCameraOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="snap-photo-title"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(25, 28, 26, 0.85)',
              backdropFilter: 'blur(16px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              style={{
                background: '#242A27',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '24px',
                maxWidth: '380px',
                width: '100%',
                textAlign: 'center'
              }}
            >
              <h2 id="snap-photo-title" style={{ margin: '0 0 16px', color: '#E4EAE6', fontSize: '18px' }}>
                Snap Profile Photo
              </h2>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }} />
              <canvas ref={canvasRef} width="200" height="200" style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={capturePhoto}
                  style={{ flex: 1, padding: '10px', background: '#7CA992', color: '#191C1A', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  style={{ padding: '10px 18px', background: 'rgba(255, 255, 255, 0.08)', color: '#E4EAE6', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESUME LESSON HERO CARD (BACKED BY REAL DUAL-TRACK PROGRESS) */}
        <div
          style={{
            background: '#242A27',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '26px 32px',
            marginBottom: '34px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flex: '1 1 480px' }}>
            <div
              aria-hidden="true"
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '20px',
                background: 'rgba(124, 169, 146, 0.18)',
                border: '1px solid rgba(124, 169, 146, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                flexShrink: 0
              }}
            >
              🎓
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    color: '#A3CBB7',
                    background: 'rgba(124, 169, 146, 0.14)',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(124, 169, 146, 0.28)'
                  }}
                >
                  Active Curriculum • Dual Track
                </span>
                <span style={{ fontSize: '12.5px', color: '#7CA992', fontWeight: '700' }}>
                  +{resumeInfo.lessonXp} XP on completion
                </span>
              </div>

              <h2 style={{ margin: '0 0 5px', fontSize: '22px', fontWeight: '800', color: '#E4EAE6' }}>
                {resumeInfo.moduleTitle}
              </h2>
              <p style={{ margin: '0 0 14px', fontSize: '13.5px', color: '#9CAEA4' }}>
                {resumeInfo.allDone ? (
                  <>Completed all free 3D lessons — review <strong style={{ color: '#E4EAE6' }}>{resumeInfo.lessonTitle}</strong></>
                ) : (
                  <>Next Lesson: <strong style={{ color: '#E4EAE6' }}>{resumeInfo.lessonTitle}</strong></>
                )}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '440px' }}>
                <div style={{ flex: 1, height: '7px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${resumeInfo.percent}%`, height: '100%', background: '#7CA992', borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '12px', color: '#A3CBB7', fontWeight: '800', whiteSpace: 'nowrap' }}>
                  {resumeInfo.percent}% ({resumeInfo.doneInMod} of {resumeInfo.totalInMod} mastered)
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to={`/courses/text-to-sign/${resumeInfo.moduleId}/${resumeInfo.lessonId}`}
              style={{
                textDecoration: 'none',
                padding: '13px 24px',
                borderRadius: '14px',
                background: '#7CA992',
                color: '#191C1A',
                fontSize: '14px',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{resumeInfo.doneInMod === 0 ? 'Start Lesson' : 'Resume Lesson'}</span>
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              to="/courses"
              style={{
                textDecoration: 'none',
                padding: '13px 20px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#B5C5BC',
                fontSize: '13.5px',
                fontWeight: '700',
                whiteSpace: 'nowrap'
              }}
            >
              All Courses
            </Link>
          </div>
        </div>

        {/* 2. 4-COLUMN REAL KPI CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '36px'
          }}
        >
          <div style={{ background: '#242A27', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.8px', color: '#A3CBB7', textTransform: 'uppercase' }}>
                Quiz Accuracy
              </span>
              <span aria-hidden="true" style={{ fontSize: '20px' }}>🎯</span>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#E4EAE6' }}>
              {stats.quizAccuracy !== null ? `${stats.quizAccuracy}%` : '—'}
            </div>
            <div style={{ fontSize: '12.5px', color: '#9CAEA4', marginTop: '10px' }}>
              {stats.totalQuizzes > 0
                ? `Computed across ${stats.totalQuizzes} completed quiz${stats.totalQuizzes === 1 ? '' : 'zes'}`
                : 'No quiz sessions recorded yet'}
            </div>
          </div>

          <div style={{ background: '#242A27', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.8px', color: '#A3CBB7', textTransform: 'uppercase' }}>
                Flashcards Practiced
              </span>
              <span aria-hidden="true" style={{ fontSize: '20px' }}>🤟</span>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#E4EAE6' }}>
              {stats.practiceCount} <span style={{ fontSize: '17px', fontWeight: '600', color: '#9CAEA4' }}>signs</span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#9CAEA4', marginTop: '10px' }}>
              {stats.practiceHistory.length} practice session{stats.practiceHistory.length === 1 ? '' : 's'} • {stats.translationsCount} translations run
            </div>
          </div>

          <div style={{ background: '#242A27', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.8px', color: '#A3CBB7', textTransform: 'uppercase' }}>
                Active Streak
              </span>
              <span aria-hidden="true" style={{ fontSize: '20px' }}>🔥</span>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#E4EAE6' }}>
              {stats.streak} <span style={{ fontSize: '17px', fontWeight: '600', color: '#9CAEA4' }}>Days</span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#9CAEA4', marginTop: '10px' }}>
              {stats.streak > 0 ? 'Consecutive daily study streak' : 'Complete a lesson, drill, or quiz to start your streak'}
            </div>
          </div>

          <div style={{ background: '#242A27', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.8px', color: '#A3CBB7', textTransform: 'uppercase' }}>
                Earned XP
              </span>
              <span aria-hidden="true" style={{ fontSize: '20px' }}>💎</span>
            </div>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#E4EAE6' }}>
              {stats.totalXP} <span style={{ fontSize: '17px', fontWeight: '600', color: '#7CA992' }}>XP</span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#9CAEA4', marginTop: '10px' }}>
              {stats.completedCount} lesson{stats.completedCount === 1 ? '' : 's'} completed • Earned from real activity
            </div>
          </div>
        </div>

        {/* 3. RANK PROGRESSION & REAL ACTIVITY LOG */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
            marginBottom: '36px'
          }}
        >
          {/* Rank Progression Ring */}
          <div
            style={{
              background: '#242A27',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#E4EAE6' }}>
                  XP Rank Progression
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#A3CBB7',
                    background: 'rgba(124, 169, 146, 0.14)',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(124, 169, 146, 0.28)'
                  }}
                >
                  {rankData.tierLevel}
                </span>
              </div>
              <p style={{ margin: '0 0 22px 0', fontSize: '13.5px', color: '#9CAEA4' }}>
                Earn +15 XP per correct quiz answer, +5 XP per practiced sign, and full lesson XP in courses.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                <div style={{ position: 'relative', width: '126px', height: '126px', flexShrink: 0 }}>
                  <svg width="126" height="126" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="65" cy="65" r="52" fill="transparent" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="10" />
                    <circle
                      cx="65"
                      cy="65"
                      r="52"
                      fill="transparent"
                      stroke="#7CA992"
                      strokeWidth="10"
                      strokeDasharray="326.72"
                      strokeDashoffset={326.72 - (rankData.percent / 100) * 326.72}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span aria-hidden="true" style={{ fontSize: '24px' }}>{rankData.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#E4EAE6' }}>{rankData.percent}%</span>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#7CA992', textTransform: 'uppercase' }}>
                    Current Standing
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#E4EAE6', marginTop: '2px' }}>
                    {rankData.rank}
                  </div>
                  <div style={{ fontSize: '13px', color: '#9CAEA4', marginTop: '6px' }}>
                    XP: <strong style={{ color: '#E4EAE6' }}>{stats.totalXP}</strong> / {rankData.tierMax}
                  </div>
                  <div style={{ fontSize: '12px', color: '#A3CBB7', marginTop: '4px', fontWeight: '600' }}>
                    {rankData.remaining > 0 ? (
                      <span>+{rankData.remaining} XP to reach {rankData.nextRank}</span>
                    ) : (
                      <span>Highest Tier Attained</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '10px' }}>
                <div style={{ position: 'absolute', top: '14px', left: '10px', right: '10px', height: '2px', background: 'rgba(255, 255, 255, 0.08)' }} />
                {[
                  { name: 'Novice', min: '0 XP', icon: '🌱', active: stats.totalXP >= 0 },
                  { name: 'Apprentice', min: '500', icon: '🌿', active: stats.totalXP >= 500 },
                  { name: 'Adept', min: '1.2k', icon: '🌲', active: stats.totalXP >= 1200 },
                  { name: 'Emerald', min: '2.2k', icon: '💎', active: stats.totalXP >= 2200 },
                  { name: 'Master', min: '3.5k', icon: '👑', active: stats.totalXP >= 3500 }
                ].map((tier, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '4px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: tier.active ? '#7CA992' : '#191C1A',
                        border: tier.active ? '2px solid #7CA992' : '2px solid rgba(255, 255, 255, 0.12)',
                        color: tier.active ? '#191C1A' : '#9CAEA4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px'
                      }}
                    >
                      {tier.icon}
                    </div>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: tier.active ? '#E4EAE6' : '#9CAEA4' }}>{tier.name}</span>
                    <span style={{ fontSize: '9.5px', color: '#85968C' }}>{tier.min}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Genuine Recorded Session Log */}
          <div
            style={{
              background: '#242A27',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#E4EAE6' }}>
                    Recent Session Log
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9CAEA4' }}>
                    Your verified quiz and practice runs stored locally
                  </p>
                </div>

                <div role="tablist" aria-label="Filter recorded activity" style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'quiz', label: 'Quizzes' },
                    { id: 'practice', label: 'Practice' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={activityTab === t.id}
                      onClick={() => setActivityTab(t.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        background: activityTab === t.id ? '#7CA992' : 'transparent',
                        color: activityTab === t.id ? '#191C1A' : '#B5C5BC',
                        fontWeight: '800',
                        border: 'none',
                        fontSize: '11.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {mergedActivities.length === 0 ? (
                <div
                  style={{
                    padding: '28px 20px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.12)',
                    textAlign: 'center',
                    marginTop: '10px'
                  }}
                >
                  <p style={{ margin: '0 0 12px', fontSize: '13.5px', color: '#B5C5BC' }}>
                    No {activityTab === 'all' ? 'quiz or practice' : activityTab} sessions recorded yet.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link
                      to="/quiz"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: '#7CA992',
                        color: '#191C1A',
                        textDecoration: 'none',
                        fontSize: '12.5px',
                        fontWeight: '800'
                      }}
                    >
                      Take a Quiz
                    </Link>
                    <Link
                      to="/practice"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#E4EAE6',
                        textDecoration: 'none',
                        fontSize: '12.5px',
                        fontWeight: '700'
                      }}
                    >
                      Open Practice
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {mergedActivities.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#E4EAE6' }}>
                          {item.label} • <span style={{ color: '#A3CBB7' }}>{item.detail}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#9CAEA4', marginTop: '2px' }}>{item.date}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#7CA992' }}>{item.pct}%</div>
                        <div style={{ fontSize: '11px', color: '#9CAEA4' }}>+{item.xpEarned} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
              <span style={{ color: '#9CAEA4' }}>
                Showing {Math.min(6, mergedActivities.length)} of {mergedActivities.length} recorded sessions
              </span>
              <Link to="/quiz" style={{ color: '#7CA992', fontWeight: '800', textDecoration: 'none' }}>
                New Quiz →
              </Link>
            </div>
          </div>
        </div>

        {/* 4. REAL ACCURACY TRAJECTORY & 7-DAY CONSISTENCY */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
            marginBottom: '36px'
          }}
        >
          {/* Real Quiz Accuracy Trajectory */}
          <div
            style={{
              background: '#242A27',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#E4EAE6' }}>
                  Quiz Precision Trajectory
                </h3>
                <span style={{ fontSize: '12px', color: '#7CA992', fontWeight: '700' }}>
                  Last {recentQuizzesForChart.length} Quiz{recentQuizzesForChart.length === 1 ? '' : 'zes'}
                </span>
              </div>
              <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#9CAEA4' }}>
                Plotted directly from your recorded quiz scores over time.
              </p>
            </div>

            {recentQuizzesForChart.length === 0 ? (
              <div
                style={{
                  height: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  color: '#9CAEA4',
                  fontSize: '13px',
                  textAlign: 'center',
                  padding: '16px'
                }}
              >
                <p style={{ margin: '0 0 10px' }}>Complete at least 1 quiz to chart your accuracy trajectory.</p>
                <Link to="/quiz" style={{ color: '#7CA992', fontWeight: '800', textDecoration: 'none' }}>
                  Start First Quiz →
                </Link>
              </div>
            ) : (
              <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                {(() => {
                  const pts = recentQuizzesForChart.map((item, idx) => {
                    const denom = Math.max(1, recentQuizzesForChart.length - 1);
                    const cx = recentQuizzesForChart.length === 1 ? 250 : 30 + (idx / denom) * 440;
                    const cy = 135 - (item.pct / 100) * 110;
                    return { cx, cy, val: `${item.pct}%`, label: item.label };
                  });
                  const polylineStr = pts.map((p) => `${p.cx},${p.cy}`).join(' ');
                  return (
                    <>
                      <svg viewBox="0 0 500 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <line x1="0" y1="25" x2="500" y2="25" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                        <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                        <line x1="0" y1="135" x2="500" y2="135" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                        {pts.length > 1 && (
                          <polyline
                            fill="none"
                            stroke="#7CA992"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={polylineStr}
                          />
                        )}
                        {pts.map((pt, i) => (
                          <g key={i}>
                            <circle
                              cx={pt.cx}
                              cy={pt.cy}
                              r={hoveredPoint?.cx === pt.cx ? '7' : '5'}
                              fill="#191C1A"
                              stroke="#7CA992"
                              strokeWidth="2.5"
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={() => setHoveredPoint(pt)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                            <text x={pt.cx} y={pt.cy - 12} fill="#B5C5BC" fontSize="11" fontWeight="700" textAnchor="middle">
                              {pt.val}
                            </text>
                          </g>
                        ))}
                      </svg>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11.5px', color: '#9CAEA4' }}>
                        {recentQuizzesForChart.map((q, idx) => (
                          <span key={idx}>{q.label}</span>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* 7-Day Real Activity Volume */}
          <div
            style={{
              background: '#242A27',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#E4EAE6' }}>
                  7-Day Practice Volume
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#A3CBB7',
                    background: 'rgba(124, 169, 146, 0.14)',
                    padding: '3px 8px',
                    borderRadius: '8px'
                  }}
                >
                  {weeklyTotal} SIGNS THIS WEEK
                </span>
              </div>
              <p style={{ margin: '0 0 24px 0', fontSize: '13.5px', color: '#9CAEA4' }}>
                Daily quiz &amp; practice sign count logged over the last 7 days.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', padding: '10px 0' }}>
              {weeklyData.map((d, idx) => {
                const max = Math.max(10, ...weeklyData.map((item) => item.count));
                const heightPercent = d.count === 0 ? 4 : Math.min(100, Math.round((d.count / max) * 100));

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: d.today ? '#7CA992' : '#9CAEA4' }}>
                      {d.count}
                    </span>
                    <div
                      style={{
                        width: '28px',
                        height: '110px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPercent}%`,
                          background: d.count === 0 ? 'rgba(255,255,255,0.08)' : d.today ? '#7CA992' : 'rgba(124, 169, 146, 0.45)',
                          borderRadius: '6px 6px 4px 4px',
                          transition: 'height 0.4s ease'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: d.today ? '800' : '600', color: d.today ? '#7CA992' : '#9CAEA4' }}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. CURRICULUM PROGRESS & EARNED MILESTONES */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px'
          }}
        >
          <div style={{ background: '#242A27', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '28px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '800', color: '#E4EAE6' }}>
              Curriculum Completion Breakdown
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#9CAEA4' }}>
              Tracked across completed lessons and verified quiz sessions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {progressDomains.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13.5px', gap: '10px' }}>
                    <span style={{ fontWeight: '600', color: '#E4EAE6' }}>{item.domain}</span>
                    <span style={{ fontWeight: '800', color: '#A3CBB7', whiteSpace: 'nowrap' }}>{item.summary}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.percent}%`, height: '100%', background: '#7CA992', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: '#242A27',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#E4EAE6' }}>
                  Milestone Badges &amp; Honors
                </h3>
                <span style={{ fontSize: '12px', color: '#7CA992', fontWeight: '700' }}>
                  {unlockedMilestoneCount} / {milestones.length} Unlocked
                </span>
              </div>
              <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#9CAEA4' }}>
                Earned automatically as you complete lessons, quizzes, and study streaks.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {milestones.map((badge, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      background: badge.unlocked ? 'rgba(124, 169, 146, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: badge.unlocked ? '1px solid rgba(124, 169, 146, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                      opacity: badge.unlocked ? 1 : 0.65,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span aria-hidden="true" style={{ fontSize: '22px' }}>{badge.icon}</span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          color: badge.unlocked ? '#191C1A' : '#9CAEA4',
                          background: badge.unlocked ? '#7CA992' : 'rgba(255,255,255,0.06)',
                          padding: '2px 7px',
                          borderRadius: '6px'
                        }}
                      >
                        {badge.unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#E4EAE6', marginTop: '6px' }}>
                      {badge.title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#9CAEA4' }}>{badge.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <Link
                to="/quiz"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  background: 'rgba(124, 169, 146, 0.14)',
                  border: '1px solid rgba(124, 169, 146, 0.28)',
                  color: '#A3CBB7',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: '700'
                }}
              >
                <span>Take Skill Verification Quiz</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
