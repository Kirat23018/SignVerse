import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { updateStreak } from '../utils/streakManager';

export default function Dashboard() {
  const [stats, setStats] = useState({
    quizAccuracy: 92.4,
    totalQuizzes: 14,
    practiceCount: 168,
    streak: 7,
    userLevel: 'Emerald Master 💎',
    totalXP: 2450
  });

  const [greeting, setGreeting] = useState('');
  const [userAvatarPhoto, setUserAvatarPhoto] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState('weekly'); // 'weekly' | 'alltime'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Dynamic Time Greeting
  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 22 || hour < 4) setGreeting('Late Night Session');
      else if (hour >= 4 && hour < 12) setGreeting('Good Morning');
      else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    updateGreeting();
  }, []);

  // Load User Stats & History
  useEffect(() => {
    try {
      const quizHistory = JSON.parse(localStorage.getItem('quizHistory')) || [];
      const practiceHistory = JSON.parse(localStorage.getItem('practiceHistory')) || [];
      const savedPhoto = localStorage.getItem('userAvatarPhoto');
      const activeStreak = updateStreak();

      let accuracy = 92.4;
      let totalQ = quizHistory.length || 14;

      if (quizHistory.length > 0) {
        const correct = quizHistory.reduce((acc, curr) => acc + curr.score, 0);
        const possible = quizHistory.reduce((acc, curr) => acc + curr.total, 0);
        accuracy = possible > 0 ? Number(((correct / possible) * 100).toFixed(1)) : 92.4;
      }

      let rank = 'Emerald Master 💎';
      if (accuracy >= 90) rank = 'Emerald Master 💎';
      else if (accuracy >= 75) rank = 'Forest Pro 🌲';
      else if (accuracy >= 55) rank = 'Sage Explorer 🌿';
      else rank = 'Apprentice 🌱';

      const totalPracticed = practiceHistory.reduce((acc, curr) => acc + curr.total, 0) || 168;

      if (savedPhoto) setUserAvatarPhoto(savedPhoto);

      setStats({
        quizAccuracy: accuracy,
        totalQuizzes: totalQ,
        practiceCount: totalPracticed,
        streak: activeStreak || 7,
        userLevel: rank,
        totalXP: 2450 + totalPracticed * 5
      });
    } catch (e) {
      console.warn('Dashboard load error:', e);
    }
  }, []);



  // 7-Day Weekly Sign Volume
  const weeklyData = [
    { day: 'Mon', count: 24, active: true },
    { day: 'Tue', count: 32, active: true },
    { day: 'Wed', count: 18, active: true },
    { day: 'Thu', count: 45, active: true },
    { day: 'Fri', count: 38, active: true },
    { day: 'Sat', count: 52, active: true },
    { day: 'Sun', count: 28, active: true, today: true }
  ];

  // XP-driven Rank Progression (Novice -> Apprentice -> Adept -> Emerald Master -> Sign Master)
  const getRankData = (xp) => {
    if (xp >= 3500) {
      return {
        rank: 'Sign Master',
        icon: '👑',
        tierMin: 3500,
        tierMax: 5000,
        nextRank: 'Grandmaster Elite (Prestige)',
        percent: Math.min(100, Math.round(((xp - 3500) / 1500) * 100)),
        remaining: 0,
        badgeColor: '#facc15',
        tierLevel: 'Level 5 (Max Tier)'
      };
    } else if (xp >= 2200) {
      return {
        rank: 'Emerald Master',
        icon: '💎',
        tierMin: 2200,
        tierMax: 3500,
        nextRank: 'Sign Master 👑',
        percent: Math.round(((xp - 2200) / (3500 - 2200)) * 100),
        remaining: 3500 - xp,
        badgeColor: '#10b981',
        tierLevel: 'Level 4'
      };
    } else if (xp >= 1200) {
      return {
        rank: 'Adept',
        icon: '🌲',
        tierMin: 1200,
        tierMax: 2200,
        nextRank: 'Emerald Master 💎',
        percent: Math.round(((xp - 1200) / (2200 - 1200)) * 100),
        remaining: 2200 - xp,
        badgeColor: '#34d399',
        tierLevel: 'Level 3'
      };
    } else if (xp >= 500) {
      return {
        rank: 'Apprentice',
        icon: '🌿',
        tierMin: 500,
        tierMax: 1200,
        nextRank: 'Adept 🌲',
        percent: Math.round(((xp - 500) / (1200 - 500)) * 100),
        remaining: 1200 - xp,
        badgeColor: '#6ee7b7',
        tierLevel: 'Level 2'
      };
    } else {
      return {
        rank: 'Novice',
        icon: '🌱',
        tierMin: 0,
        tierMax: 500,
        nextRank: 'Apprentice 🌿',
        percent: Math.round((xp / 500) * 100),
        remaining: 500 - xp,
        badgeColor: '#a7f3d0',
        tierLevel: 'Level 1'
      };
    }
  };

  const rankData = getRankData(stats.totalXP);

  // Weekly & All-Time Competitive Leaderboard Data
  const weeklyLeaderboard = [
    { rank: 1, name: 'Elena Rostova', xp: 3820, tier: 'Sign Master', flag: '🇺🇸', streak: 14, avatar: '👩‍💼', isUser: false },
    { rank: 2, name: 'Marcus Chen', xp: 3410, tier: 'Emerald Master', flag: '🇸🇬', streak: 9, avatar: '👨‍💻', isUser: false },
    { rank: 3, name: 'Aarav Sharma', xp: 2890, tier: 'Emerald Master', flag: '🇮🇳', streak: 12, avatar: '👨‍🎓', isUser: false },
    { rank: 4, name: 'You (Alex)', xp: stats.totalXP, tier: rankData.rank, flag: '🌐', streak: stats.streak, avatar: '👤', isUser: true },
    { rank: 5, name: 'Sophia Vance', xp: 2180, tier: 'Adept', flag: '🇬🇧', streak: 5, avatar: '👩‍🔬', isUser: false },
    { rank: 6, name: 'Kenji Sato', xp: 1940, tier: 'Adept', flag: '🇯🇵', streak: 6, avatar: '👨‍🎨', isUser: false },
    { rank: 7, name: 'Liam O’Connor', xp: 1620, tier: 'Adept', flag: '🇮🇪', streak: 4, avatar: '🧑‍🚀', isUser: false }
  ];

  const alltimeLeaderboard = [
    { rank: 1, name: 'David Kim', xp: 12450, tier: 'Sign Master', flag: '🇰🇷', streak: 45, avatar: '👨‍💼', isUser: false },
    { rank: 2, name: 'Elena Rostova', xp: 9820, tier: 'Sign Master', flag: '🇺🇸', streak: 28, avatar: '👩‍💼', isUser: false },
    { rank: 3, name: 'Maya Patel', xp: 8740, tier: 'Sign Master', flag: '🇮🇳', streak: 31, avatar: '👩‍🎓', isUser: false },
    { rank: 4, name: 'Marcus Chen', xp: 7410, tier: 'Sign Master', flag: '🇸🇬', streak: 22, avatar: '👨‍💻', isUser: false },
    { rank: 5, name: 'Amara Okafor', xp: 6200, tier: 'Emerald Master', flag: '🇳🇬', streak: 19, avatar: '👩‍⚕️', isUser: false },
    { rank: 12, name: 'You (Alex)', xp: stats.totalXP, tier: rankData.rank, flag: '🌐', streak: stats.streak, avatar: '👤', isUser: true }
  ];

  // Avatar Photo Handlers
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserAvatarPhoto(reader.result);
        localStorage.setItem('userAvatarPhoto', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 200, 200);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setUserAvatarPhoto(dataUrl);
      localStorage.setItem('userAvatarPhoto', dataUrl);
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
        
        {/* =========================================================================
            1. ACCESSIBLE SAGE HEADER & PROFILE OVERVIEW
        ========================================================================= */}
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
          {/* User Profile & Greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div
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
                  cursor: 'pointer'
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Click to upload profile photo"
              >
                {userAvatarPhoto ? (
                  <img src={userAvatarPhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>👤</span>
                )}
              </div>

              {/* Snapshot Camera Trigger */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); startCamera(); }}
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
                📷
              </button>

              {/* Status Indicator */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#7CA992',
                  border: '2px solid #191C1A'
                }}
              />
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
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
                  {stats.userLevel}
                </span>
                <span style={{ fontSize: '13px', color: '#9CAEA4' }}>•</span>
                <span style={{ fontSize: '13px', color: '#9CAEA4', letterSpacing: '0.2px' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(28px, 3.5vw, 42px)',
                  fontWeight: '800',
                  margin: 0,
                  letterSpacing: '-0.8px',
                  color: '#E4EAE6'
                }}
              >
                {greeting}, <span style={{ color: '#7CA992' }}>Signer</span>
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: '14.5px', color: '#9CAEA4' }}>
                Your comprehensive mastery progress, daily rhythm, and precision accuracy overview.
              </p>
            </div>
          </div>

          {/* Quick Hub Navigation Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link
              to="/text-to-sign"
              style={{
                textDecoration: 'none',
                padding: '11px 20px',
                borderRadius: '14px',
                background: 'rgba(124, 169, 146, 0.12)',
                border: '1px solid rgba(124, 169, 146, 0.25)',
                color: '#7CA992',
                fontSize: '13.5px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <span>🗣️ 3D Translator</span>
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
                gap: '8px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s'
              }}
            >
              <span>📷 LiveCam Studio</span>
            </Link>
          </div>
        </div>

        {/* Camera Modal if taking picture */}
        {isCameraOpen && (
          <div
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
                textAlign: 'center',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)'
              }}
            >
              <h3 style={{ margin: '0 0 16px', color: '#E4EAE6' }}>Snap Profile Photo</h3>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }} />
              <canvas ref={canvasRef} width="200" height="200" style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  onClick={capturePhoto}
                  style={{ flex: 1, padding: '10px', background: '#7CA992', color: '#191C1A', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  style={{ padding: '10px 18px', background: 'rgba(255, 255, 255, 0.06)', color: '#E4EAE6', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PROMINENT RESUME COURSE / CURRENT LESSON HERO CARD
        ========================================================================= */}
        <div
          style={{
            background: '#242A27',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '26px 32px',
            marginBottom: '34px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px', zIndex: 1, flex: '1 1 520px' }}>
            {/* Visual Icon Badge */}
            <div
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
                    color: '#7CA992',
                    background: 'rgba(124, 169, 146, 0.14)',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(124, 169, 146, 0.28)'
                  }}
                >
                  Active Curriculum • Dual Track
                </span>
                <span style={{ fontSize: '12px', color: '#9CAEA4' }}>•</span>
                <span style={{ fontSize: '12.5px', color: '#7CA992', fontWeight: '800', letterSpacing: '0.2px' }}>
                  +50 XP Rank Point on Completion
                </span>
              </div>

              <h2 style={{ margin: '0 0 5px', fontSize: '22px', fontWeight: '800', color: '#E4EAE6', letterSpacing: '-0.4px' }}>
                Everyday Basics & Greetings
              </h2>
              <p style={{ margin: '0 0 14px', fontSize: '13.5px', color: '#9CAEA4' }}>
                Next Up: <strong style={{ color: '#E4EAE6' }}>Lesson 2 — Expressing Gratitude (&quot;Thank You&quot;)</strong> • 3D Avatar Luna Instruction
              </p>

              {/* Progress Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '440px' }}>
                <div style={{ flex: 1, height: '7px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '65%', height: '100%', background: '#7CA992', borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '12px', color: '#7CA992', fontWeight: '800', whiteSpace: 'nowrap' }}>
                  65% Completed (1 of 4 Mastered)
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
            <Link
              to="/courses/text-to-sign/tts-mod-1/tts-l1-2"
              style={{
                textDecoration: 'none',
                padding: '13px 26px',
                borderRadius: '14px',
                background: '#7CA992',
                color: '#191C1A',
                fontSize: '14px',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <span>Resume Lesson</span>
              <span>➔</span>
            </Link>

            <Link
              to="/courses"
              style={{
                textDecoration: 'none',
                padding: '13px 20px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#9CAEA4',
                fontSize: '13.5px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <span>All Courses</span>
            </Link>
          </div>
        </div>

        {/* =========================================================================
            2. SPACIOUS 4-COLUMN SAGE KPI CARDS
        ========================================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '22px',
            marginBottom: '36px'
          }}
        >
          {/* Card 1: Accuracy */}
          <div
            style={{
              background: '#242A27',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.8px', color: '#7CA992', textTransform: 'uppercase' }}>
                Overall Accuracy
              </span>
              <span style={{ fontSize: '20px' }}>🎯</span>
            </div>
            <div style={{ fontSize: '38px', fontWeight: '900', color: '#E4EAE6', letterSpacing: '-1px' }}>
              {stats.quizAccuracy}%
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <div style={{ flex: 1, height: '5px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${stats.quizAccuracy}%`, height: '100%', background: '#7CA992', borderRadius: '4px' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#7CA992', fontWeight: '700' }}>+4.2%</span>
            </div>
          </div>

          {/* Card 2: Total Gestures Mastered */}
          <div
            style={{
              background: '#242A27',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.8px', color: '#7CA992', textTransform: 'uppercase' }}>
                Gestures Practiced
              </span>
              <span style={{ fontSize: '20px' }}>🤟</span>
            </div>
            <div style={{ fontSize: '38px', fontWeight: '900', color: '#E4EAE6', letterSpacing: '-1px' }}>
              {stats.practiceCount} <span style={{ fontSize: '18px', fontWeight: '600', color: '#9CAEA4' }}>signs</span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#9CAEA4', marginTop: '12px' }}>
              Across 3D avatar & camera drills
            </div>
          </div>

          {/* Card 3: Active Streak */}
          <div
            style={{
              background: '#242A27',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.8px', color: '#7CA992', textTransform: 'uppercase' }}>
                Rhythm & Streak
              </span>
              <span style={{ fontSize: '20px' }}>🔥</span>
            </div>
            <div style={{ fontSize: '38px', fontWeight: '900', color: '#E4EAE6', letterSpacing: '-1px' }}>
              {stats.streak} <span style={{ fontSize: '18px', fontWeight: '600', color: '#9CAEA4' }}>Days</span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#7CA992', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7CA992' }} />
              <span>Streak safe for today • Keep it up!</span>
            </div>
          </div>

          {/* Card 4: Total Competitive XP & Standing */}
          <div
            style={{
              background: '#242A27',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.8px', color: '#7CA992', textTransform: 'uppercase' }}>
                Competitive XP
              </span>
              <span style={{ fontSize: '20px' }}>💎</span>
            </div>
            <div style={{ fontSize: '38px', fontWeight: '900', color: '#E4EAE6', letterSpacing: '-1px' }}>
              {stats.totalXP} <span style={{ fontSize: '18px', fontWeight: '600', color: '#7CA992' }}>XP</span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#9CAEA4', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#7CA992', fontWeight: '700' }}>Rank #4 Global</span>
              <span>•</span>
              <span>Fuels Leaderboard ONLY</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. RANK PROGRESSION SYSTEM (PROGRESS RING) & GLOBAL LEADERBOARD
        ========================================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px',
            marginBottom: '36px'
          }}
        >
          {/* Left: Rank Progression System with Circular Gauge */}
          <div
            style={{
              background: '#242A27',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#E4EAE6', letterSpacing: '-0.3px' }}>
                  Rank Progression
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#7CA992',
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
                XP points exclusively govern your official tier rank. Every sign verified climbs your standing.
              </p>

              {/* Progress Ring & Current Standing Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                {/* Circular SVG Gauge */}
                <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                  <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background Ring Track */}
                    <circle
                      cx="65"
                      cy="65"
                      r="52"
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeWidth="10"
                    />
                    {/* Animated Progress Ring */}
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
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '26px' }}>{rankData.icon}</span>
                    <span style={{ fontSize: '15px', fontWeight: '900', color: '#E4EAE6', letterSpacing: '-0.5px' }}>
                      {rankData.percent}%
                    </span>
                  </div>
                </div>

                {/* Rank Standing Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#7CA992', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Current Standing
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#E4EAE6', letterSpacing: '-0.5px', marginTop: '2px' }}>
                    {rankData.rank}
                  </div>
                  <div style={{ fontSize: '13px', color: '#9CAEA4', marginTop: '6px' }}>
                    XP: <strong style={{ color: '#E4EAE6' }}>{stats.totalXP}</strong> / {rankData.tierMax}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7CA992', marginTop: '4px', fontWeight: '600' }}>
                    {rankData.remaining > 0 ? (
                      <span>+<strong>{rankData.remaining} XP</strong> to reach {rankData.nextRank}</span>
                    ) : (
                      <span>Highest Tier Attained! 👑</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 5-Step Tier Roadmap */}
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '10px' }}>
                <div style={{ position: 'absolute', top: '14px', left: '10px', right: '10px', height: '2px', background: 'rgba(255, 255, 255, 0.08)', zIndex: 0 }} />
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
                    <span style={{ fontSize: '10.5px', fontWeight: tier.active ? '800' : '500', color: tier.active ? '#E4EAE6' : '#9CAEA4' }}>
                      {tier.name}
                    </span>
                    <span style={{ fontSize: '9.5px', color: '#9CAEA4' }}>{tier.min}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitive Guarantee Note */}
            <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '12px', color: '#9CAEA4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔒</span>
                <span>
                  <strong style={{ color: '#7CA992' }}>Competitive Integrity:</strong> XP points strictly determine rank promotions and leaderboard tiers. No gimmick deductions.
                </span>
              </div>
            </div>
          </div>

          {/* Right: Global Competitive Leaderboard */}
          <div
            style={{
              background: '#242A27',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              {/* Header & Tabs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#E4EAE6', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🏆</span>
                    <span>Global Competitive Leaderboard</span>
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9CAEA4' }}>
                    Ranked by verified XP output • Top 3 signers promote weekly
                  </p>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <button
                    onClick={() => setLeaderboardTab('weekly')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: leaderboardTab === 'weekly' ? '#7CA992' : 'transparent',
                      color: leaderboardTab === 'weekly' ? '#191C1A' : '#9CAEA4',
                      fontWeight: '800',
                      border: 'none',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Weekly Cup
                  </button>
                  <button
                    onClick={() => setLeaderboardTab('alltime')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      background: leaderboardTab === 'alltime' ? '#7CA992' : 'transparent',
                      color: leaderboardTab === 'alltime' ? '#191C1A' : '#9CAEA4',
                      fontWeight: '800',
                      border: 'none',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    All-Time Hall
                  </button>
                </div>
              </div>

              {/* Promotion Zone Banner */}
              <div
                style={{
                  background: 'rgba(124, 169, 146, 0.12)',
                  border: '1px solid rgba(124, 169, 146, 0.25)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}
              >
                <span style={{ color: '#7CA992', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡</span>
                  <span>Promotion Zone: Top 3 advance to Diamond League</span>
                </span>
                <span style={{ color: '#9CAEA4', fontWeight: '600' }}>
                  Resets in 2d 14h
                </span>
              </div>

              {/* Leaderboard Table / Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(leaderboardTab === 'weekly' ? weeklyLeaderboard : alltimeLeaderboard).map((row) => (
                  <div
                    key={row.rank}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: row.isUser ? '10px 16px' : '9px 14px',
                      borderRadius: '14px',
                      background: row.isUser ? 'rgba(124, 169, 146, 0.16)' : 'rgba(255, 255, 255, 0.02)',
                      border: row.isUser ? '1.5px solid rgba(124, 169, 146, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {/* Rank & User Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '26px',
                          textAlign: 'center',
                          fontSize: row.rank <= 3 ? '16px' : '12px',
                          fontWeight: '800',
                          color: row.rank === 1 ? '#d4a373' : row.rank === 2 ? '#cbd5e1' : row.rank === 3 ? '#a8a29e' : '#9CAEA4'
                        }}
                      >
                        {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`}
                      </div>

                      <span style={{ fontSize: '18px' }}>{row.avatar}</span>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: row.isUser ? '800' : '700', color: row.isUser ? '#7CA992' : '#E4EAE6' }}>
                            {row.name}
                          </span>
                          <span style={{ fontSize: '12px' }}>{row.flag}</span>
                          {row.isUser && (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: '900',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: '#7CA992',
                                color: '#191C1A',
                                textTransform: 'uppercase'
                              }}
                            >
                              YOU
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9CAEA4' }}>
                          {row.tier} • {row.streak}d streak 🔥
                        </div>
                      </div>
                    </div>

                    {/* XP Score */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: row.isUser ? '#7CA992' : '#E4EAE6', letterSpacing: '-0.3px' }}>
                        {row.xp.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '700', color: '#9CAEA4' }}>XP</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Promotion Incentive Footer */}
            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
              <span style={{ color: '#9CAEA4' }}>
                Need <strong style={{ color: '#7CA992' }}>+440 XP</strong> to claim 3rd place podium.
              </span>
              <Link
                to="/quiz"
                style={{
                  color: '#7CA992',
                  fontWeight: '800',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Earn XP in Quiz</span>
                <span>➔</span>
              </Link>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. PERFORMANCE CHART (LEFT) & 7-DAY CONSISTENCY (RIGHT)
        ========================================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px',
            marginBottom: '36px'
          }}
        >
          {/* Left Chart: Accuracy Progression Curve */}
          <div
            style={{
              background: '#242A27',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#E4EAE6', letterSpacing: '-0.3px' }}>
                  Accuracy Curve & Precision Trajectory
                </h3>
                <span style={{ fontSize: '12px', color: '#7CA992', fontWeight: '700' }}>
                  Last 7 Assessments
                </span>
              </div>
              <p style={{ margin: '0 0 24px 0', fontSize: '13.5px', color: '#9CAEA4' }}>
                Visual trajectory of real-time sign recognition scores across flashcards and quizzes.
              </p>
            </div>

            {/* SVG Interactive Smooth Line Graph */}
            <div style={{ width: '100%', height: '180px', position: 'relative' }}>
              <svg viewBox="0 0 500 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="sageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7CA992" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#7CA992" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

                {/* Shaded Area */}
                <path
                  d="M 20 110 Q 90 90, 160 80 T 300 50 T 420 35 T 480 20 L 480 150 L 20 150 Z"
                  fill="url(#sageGradient)"
                />

                {/* Smooth Curve Path */}
                <path
                  d="M 20 110 Q 90 90, 160 80 T 300 50 T 420 35 T 480 20"
                  fill="none"
                  stroke="#7CA992"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                {[
                  { cx: 20, cy: 110, val: '72%' },
                  { cx: 100, cy: 92, val: '78%' },
                  { cx: 180, cy: 80, val: '82%' },
                  { cx: 260, cy: 65, val: '85%' },
                  { cx: 340, cy: 50, val: '89%' },
                  { cx: 420, cy: 35, val: '91%' },
                  { cx: 480, cy: 20, val: `${stats.quizAccuracy}%` }
                ].map((pt, i) => (
                  <g key={i}>
                    <circle
                      cx={pt.cx}
                      cy={pt.cy}
                      r="5"
                      fill="#191C1A"
                      stroke="#7CA992"
                      strokeWidth="2.5"
                      style={{ cursor: 'pointer', transition: 'r 0.2s' }}
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    <text
                      x={pt.cx}
                      y={pt.cy - 10}
                      fill="#9CAEA4"
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {pt.val}
                    </text>
                  </g>
                ))}
              </svg>

              {/* X-axis labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11.5px', color: '#9CAEA4' }}>
                <span>Start</span>
                <span>Module 1</span>
                <span>Module 2</span>
                <span>Module 3</span>
                <span>Current Peak</span>
              </div>
            </div>
          </div>

          {/* Right Chart: 7-Day Consistency Rhythm */}
          <div
            style={{
              background: '#242A27',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#E4EAE6', letterSpacing: '-0.3px' }}>
                  Weekly Practice Volume
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#7CA992',
                    background: 'rgba(124, 169, 146, 0.14)',
                    padding: '3px 8px',
                    borderRadius: '8px'
                  }}
                >
                  237 SIGNS THIS WEEK
                </span>
              </div>
              <p style={{ margin: '0 0 24px 0', fontSize: '13.5px', color: '#9CAEA4' }}>
                Daily signing output across all modules and webcam drills.
              </p>
            </div>

            {/* Weekly Minimalist Bar Chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', padding: '10px 0' }}>
              {weeklyData.map((d, idx) => {
                const max = 60;
                const heightPercent = Math.min(100, Math.round((d.count / max) * 100));

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1
                    }}
                  >
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
                          background: d.today
                            ? '#7CA992'
                            : 'rgba(124, 169, 146, 0.38)',
                          borderRadius: '6px 6px 4px 4px',
                          transition: 'height 0.4s ease'
                        }}
                      />
                    </div>

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: d.today ? '800' : '600',
                        color: d.today ? '#7CA992' : '#9CAEA4'
                      }}
                    >
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. DOMAIN COMPETENCY & TROPHY SHELF
        ========================================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px'
          }}
        >
          {/* Domain Breakdown */}
          <div
            style={{
              background: '#242A27',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)'
            }}
          >
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '800', color: '#E4EAE6' }}>
              Vocabulary Domain Competency
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#9CAEA4' }}>
              Mastery scores calculated from real-time gesture recall speed.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { domain: 'Fingerspelling Alphabets (A-Z)', percent: 98, level: 'Flawless' },
                { domain: 'Everyday Greetings & Introductions', percent: 94, level: 'Fluent' },
                { domain: 'Camera Static Signs (Yes, Stop, One, Rock, Victory)', percent: 92, level: 'Certified' },
                { domain: 'Food, Dining & Grocery Essentials', percent: 84, level: 'Advanced' },
                { domain: 'Emergency, Healthcare & Safety', percent: 88, level: 'Advanced' }
              ].map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13.5px' }}>
                    <span style={{ fontWeight: '600', color: '#E4EAE6' }}>{item.domain}</span>
                    <span style={{ fontWeight: '800', color: '#7CA992' }}>{item.percent}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${item.percent}%`,
                        height: '100%',
                        background: '#7CA992',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trophy Shelf & Milestones */}
          <div
            style={{
              background: '#242A27',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#E4EAE6' }}>
                  Milestone Badges & Honors
                </h3>
                <span style={{ fontSize: '12px', color: '#7CA992', fontWeight: '700' }}>4 / 4 Unlocked</span>
              </div>
              <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#9CAEA4' }}>
                Recognized achievements awarded for accuracy and streak milestones.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {[
                  { icon: '💎', title: 'Sage Elite', desc: 'Maintained 90%+ Accuracy' },
                  { icon: '🔥', title: '7-Day Champion', desc: 'Zero Days Missed This Week' },
                  { icon: '📷', title: 'Vision Pioneer', desc: '5 Signs MediaPipe Mastered' },
                  { icon: '⚡', title: 'Velocity Signer', desc: 'Sub-2s Recognition Speed' }
                ].map((badge, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{badge.icon}</span>
                    <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#E4EAE6', marginTop: '4px' }}>
                      {badge.title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#9CAEA4' }}>
                      {badge.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Practice Shortcut */}
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
                  color: '#7CA992',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: '700'
                }}
              >
                <span>Take Daily Skill Verification Quiz</span>
                <span>➔</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}