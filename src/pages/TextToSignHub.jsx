import React from 'react';
import { Link } from 'react-router-dom';

export default function TextToSignHub() {
  const hubFeatures = [
    {
      step: 1,
      id: 'alphabets',
      title: 'Alphabets (Fingerspelling)',
      stepBadge: 'STEP 1 • FOUNDATION',
      icon: '🔤',
      accentColor: '#7CA992',
      description: 'Master the fundamental A–Z fingerspelling alphabet. Rotate the 3D avatar 360° to inspect exact finger joint bends, thumb positions, and palm angles.',
      link: '/alphabets',
      tags: ['A-Z Letters', '360° 3D Rotation', 'Hand Shape Details', 'Beginner Essential']
    },
    {
      step: 2,
      id: 'words',
      title: 'Words (Sign Dictionary)',
      stepBadge: 'STEP 2 • VOCABULARY',
      icon: '📚',
      accentColor: '#8DB39F',
      description: 'Explore our vast dictionary of 900+ animated vocabulary signs covering greetings, food, family, emergency phrases, and everyday conversation.',
      link: '/words',
      tags: ['900+ Signs', 'Categorized', 'Instant Search', 'Demonstration Clips']
    },
    {
      step: 3,
      id: 'translate',
      title: '3D Translator (Live Text/Voice to Sign)',
      stepBadge: 'STEP 3 • CORE ENGINE',
      icon: '🗣️',
      accentColor: '#7CA992',
      description: 'Type any full English sentence or speak aloud to generate fluid sign language animations in real time with our WebGL 3D avatar instructor.',
      link: '/translate',
      tags: ['Voice-to-Sign', 'CWASA 3D WebGL', 'Grammar Parser', 'Instant Play']
    },
    {
      step: 4,
      id: 'practice',
      title: 'Practice (Flashcards/Studio)',
      stepBadge: 'STEP 4 • RETENTION',
      icon: '🎯',
      accentColor: '#A3C7B5',
      description: 'Reinforce muscle memory and recall speed through self-paced interactive flashcard drills and spaced-repetition confidence scoring.',
      link: '/practice',
      tags: ['Flashcards', 'Self-Paced', 'Spaced Repetition', 'Recall Drills']
    },
    {
      step: 5,
      id: 'quiz',
      title: 'Quizzes (Interactive Ranked)',
      stepBadge: 'STEP 5 • COMPETITION',
      icon: '🏆',
      accentColor: '#7CA992',
      description: 'Challenge your visual recognition against the countdown clock. Earn streak multipliers, level up your signer tier, and collect XP rewards.',
      link: '/quiz',
      tags: ['Timed Arena', 'XP Rewards', 'Streak Multiplier', 'Leaderboard']
    },
    {
      step: 6,
      id: 'dashboard',
      title: 'Dashboard (Progress Tracking)',
      stepBadge: 'STEP 6 • ANALYTICS',
      icon: '📊',
      accentColor: '#8DB39F',
      description: 'Monitor your signs mastered, daily streaks, study hours, active subscription credits, and unlockable achievement milestone badges.',
      link: '/dashboard',
      tags: ['Streak Tracker', 'Mastery Analytics', 'Achievement Badges', 'Pro Membership']
    }
  ];

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 65px)',
        backgroundColor: '#191C1A',
        color: '#E4EAE6',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '36px 20px 80px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Ambient background glows */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 169, 146, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '10%',
          right: '5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 169, 146, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* Header Breadcrumb & Title */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px', color: '#9CAEA4' }}>
            <Link to="/" style={{ color: '#7CA992', textDecoration: 'none', fontWeight: '600' }}>Home</Link>
            <span>/</span>
            <span style={{ color: '#E4EAE6' }}>Text-to-Sign Hub</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(124, 169, 146, 0.12)', border: '1px solid rgba(124, 169, 146, 0.25)', color: '#7CA992', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
                <span>🌿 3D AVATAR SIGN LANGUAGE FLOW</span>
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '800', margin: 0, letterSpacing: '-0.8px', color: '#E4EAE6' }}>
                Text-to-Sign <span style={{ color: '#7CA992' }}>Ecosystem</span>
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: '15.5px', color: '#9CAEA4', maxWidth: '720px', lineHeight: '1.6' }}>
                Follow our recommended 6-step learning journey: from foundational fingerspelling and comprehensive vocabulary to live 3D translation and ranked mastery.
              </p>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                to="/dashboard"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '14px',
                  background: '#242A27',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#E4EAE6',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>📊 Dashboard</span>
              </Link>

              <Link
                to="/sign-to-text"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '14px',
                  background: '#7CA992',
                  border: '1px solid #7CA992',
                  color: '#191C1A',
                  fontWeight: '700',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>Sign-to-Text Camera</span>
                <span style={{ fontSize: '16px' }}>📷 →</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recommended Learning Path Track Bar */}
        <div
          style={{
            marginBottom: '32px',
            padding: '16px 24px',
            borderRadius: '18px',
            background: '#242A27',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🗺️</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.8px', color: '#7CA992', textTransform: 'uppercase' }}>
                Guided Curriculum Path
              </div>
              <div style={{ fontSize: '13.5px', color: '#9CAEA4' }}>
                Follow cards <strong>1 through 6</strong> in sequential order for maximum retention
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {hubFeatures.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#E4EAE6',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7CA992';
                  e.currentTarget.style.color = '#7CA992';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#E4EAE6';
                }}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: item.accentColor,
                    color: '#191C1A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10.5px',
                    fontWeight: '900'
                  }}
                >
                  {item.step}
                </span>
                <span>{item.title.split(' ')[0]}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 6 Reordered Glassmorphic Cards (Strict Numerical Order 1 to 6) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '24px'
          }}
        >
          {hubFeatures.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  height: '100%',
                  background: '#242A27',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#7CA992';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div>
                  {/* Card Header: Icon, Step Badge & PROMINENT NUMBER BADGE */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '14px',
                          background: 'rgba(124, 169, 146, 0.12)',
                          border: '1px solid rgba(124, 169, 146, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}
                      >
                        {item.icon}
                      </div>

                      <div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            letterSpacing: '0.8px',
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            background: 'rgba(124, 169, 146, 0.1)',
                            color: '#7CA992',
                            border: '1px solid rgba(124, 169, 146, 0.2)',
                            display: 'inline-block'
                          }}
                        >
                          {item.stepBadge}
                        </span>
                      </div>
                    </div>

                    {/* Prominent Number Badge (1 to 6) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(124, 169, 146, 0.4)',
                        position: 'relative'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '17px',
                          fontWeight: '800',
                          color: '#E4EAE6',
                          fontFamily: 'monospace'
                        }}
                      >
                        0{item.step}
                      </span>
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 10px 0', fontSize: '19px', fontWeight: '800', color: '#E4EAE6' }}>
                    {item.title}
                  </h3>

                  <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#9CAEA4', lineHeight: '1.6' }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
                    {item.tags.map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '11.5px',
                          padding: '3px 9px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: '#E4EAE6',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    color: '#7CA992'
                  }}
                >
                  <span>Launch Step {item.step}</span>
                  <span style={{ fontSize: '16px' }}>➔</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
