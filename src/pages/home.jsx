import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const avatarInstructors = [
    { name: 'Luna', role: 'Intro & Basics', img: '/avatars/luna.png' },
    { name: 'Marc', role: 'Conversational', img: '/avatars/marc.png' },
    { name: 'Francoise', role: 'Grammar & Tone', img: '/avatars/francoise.png' },
    { name: 'Anna', role: 'Everyday Signs', img: '/avatars/anna.png' },
    { name: 'Siggi', role: 'Advanced SiGML', img: '/avatars/siggi.png' }
  ];

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 65px)',
        backgroundColor: '#191C1A',
        color: '#E4EAE6',
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflowX: 'hidden',
        paddingBottom: '80px'
      }}
    >
      {/* Ambient Soothing Sage Radial Mesh Glows */}
      <div
        style={{
          position: 'fixed',
          top: '-15%',
          left: '20%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 169, 146, 0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '35%',
          right: '-10%',
          width: '750px',
          height: '750px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 169, 146, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        
        {/* ================= 1. HERO TITLE SECTION ================= */}
        <div style={{ textAlign: 'center', padding: 'clamp(44px, 6.5vw, 80px) 0 40px 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(124, 169, 146, 0.12)',
              color: '#7CA992',
              padding: '6px 20px',
              borderRadius: '30px',
              fontSize: '12.5px',
              fontWeight: '700',
              letterSpacing: '0.8px',
              marginBottom: '22px',
              border: '1px solid rgba(124, 169, 146, 0.25)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <span style={{ fontSize: '14px' }}>🌿</span>
            <span>DUAL-WAY ACCESSIBLE SIGN INTELLIGENCE</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(34px, 5.5vw, 62px)',
              fontWeight: '900',
              color: '#E4EAE6',
              maxWidth: '920px',
              margin: '0 auto 20px auto',
              lineHeight: '1.14',
              letterSpacing: '-1.2px'
            }}
          >
            Break Communication Barriers With <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #7CA992 0%, #A3C7B5 50%, #C8DDD2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Interactive 3D & Vision AI
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(15px, 1.8vw, 18.5px)',
              color: '#9CAEA4',
              maxWidth: '700px',
              margin: '0 auto 36px auto',
              lineHeight: '1.65'
            }}
          >
            The soothing, accessible sign language intelligence platform. Seamlessly convert speech and text to lifelike 3D sign animations, or use your camera to translate hand signs into live text without eye strain.
          </p>
        </div>

        {/* ================= 2. TWO MASSIVE INTERACTIVE GLASSMORPHIC CARDS ================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '28px',
            marginBottom: '64px'
          }}
        >
          {/* CARD 1: TEXT-TO-SIGN */}
          <Link
            to="/text-to-sign"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                height: '100%',
                background: '#242A27',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '28px',
                padding: 'clamp(28px, 4vw, 44px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(124, 169, 146, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '18px',
                      background: 'rgba(124, 169, 146, 0.15)',
                      border: '1px solid rgba(124, 169, 146, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '30px'
                    }}
                  >
                    🗣️
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      padding: '6px 14px',
                      borderRadius: '16px',
                      background: 'rgba(124, 169, 146, 0.12)',
                      color: '#7CA992',
                      border: '1px solid rgba(124, 169, 146, 0.25)'
                    }}
                  >
                    3D AVATAR SYSTEM
                  </span>
                </div>

                <h2 style={{ fontSize: 'clamp(24px, 3vw, 30px)', fontWeight: '800', margin: '0 0 14px 0', color: '#E4EAE6' }}>
                  Text-to-Sign
                </h2>

                <p style={{ fontSize: '15px', color: '#9CAEA4', lineHeight: '1.65', margin: '0 0 28px 0' }}>
                  Convert text or spoken voice into soothing 3D sign language animations. Includes a complete ecosystem with fingerspelling alphabets, dictionary vocabulary, flashcard practice, and ranked skill quizzes.
                </p>

                {/* Feature Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                  {['3D Avatar Instructors', 'Voice & Text', 'A-Z Alphabets', 'Practice & Quiz', 'Dashboard'].map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '12px',
                        padding: '5px 12px',
                        borderRadius: '10px',
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

              {/* Action Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 22px',
                  borderRadius: '16px',
                  background: '#7CA992',
                  border: '1px solid #7CA992',
                  color: '#191C1A',
                  fontWeight: '700',
                  fontSize: '15px',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <span>Launch Text-to-Sign Hub</span>
                <span style={{ fontSize: '18px' }}>➔</span>
              </div>
            </div>
          </Link>

          {/* CARD 2: SIGN-TO-TEXT */}
          <Link
            to="/sign-to-text"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                height: '100%',
                background: '#242A27',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '28px',
                padding: 'clamp(28px, 4vw, 44px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(124, 169, 146, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '18px',
                      background: 'rgba(124, 169, 146, 0.15)',
                      border: '1px solid rgba(124, 169, 146, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '30px'
                    }}
                  >
                    📷
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      padding: '6px 14px',
                      borderRadius: '16px',
                      background: 'rgba(124, 169, 146, 0.12)',
                      color: '#7CA992',
                      border: '1px solid rgba(124, 169, 146, 0.25)'
                    }}
                  >
                    LIVE VISION AI
                  </span>
                </div>

                <h2 style={{ fontSize: 'clamp(24px, 3vw, 30px)', fontWeight: '800', margin: '0 0 14px 0', color: '#E4EAE6' }}>
                  Sign-to-Text
                </h2>

                <p style={{ fontSize: '15px', color: '#9CAEA4', lineHeight: '1.65', margin: '0 0 28px 0' }}>
                  Perform sign gestures comfortably in front of your camera. In-browser MediaPipe vision tracks 21 hand joints in real time to instantly translate gestures with our deep learning model.
                </p>

                {/* Feature Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                  {['Dual Layout Studio', 'TF.js Deep Learning', '21 Hand Landmarks', '100% In-Browser', 'Privacy Safe'].map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '12px',
                        padding: '5px 12px',
                        borderRadius: '10px',
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

              {/* Action Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 22px',
                  borderRadius: '16px',
                  background: '#7CA992',
                  border: '1px solid #7CA992',
                  color: '#191C1A',
                  fontWeight: '700',
                  fontSize: '15px'
                }}
              >
                <span>Launch Sign-to-Text Studio</span>
                <span style={{ fontSize: '18px' }}>➔</span>
              </div>
            </div>
          </Link>
        </div>

        {/* ================= 3. 3D AVATAR INSTRUCTORS SECTION ================= */}
        <div
          style={{
            background: '#242A27',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '36px 28px',
            marginBottom: '48px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800', color: '#E4EAE6' }}>
                Meet Our 3D Sign Instructors
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#9CAEA4' }}>
                Comfortable digital avatars built for lifelike fingerspelling and body motion.
              </p>
            </div>
            <Link
              to="/text-to-sign/translate"
              style={{
                color: '#7CA992',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Try Live in 3D Translator</span>
              <span>➔</span>
            </Link>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              paddingBottom: '12px',
              scrollbarWidth: 'thin'
            }}
          >
            {avatarInstructors.map((avatar, idx) => (
              <div
                key={idx}
                style={{
                  flex: '0 0 180px',
                  background: '#191C1A',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(124, 169, 146, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div style={{ height: '170px', backgroundColor: '#242A27', overflow: 'hidden' }}>
                  <img
                    src={avatar.img}
                    alt={avatar.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                  />
                </div>
                <div style={{ padding: '12px 10px' }}>
                  <div style={{ fontWeight: '800', fontSize: '16px', color: '#E4EAE6' }}>{avatar.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#7CA992', marginTop: '2px', fontWeight: '600' }}>{avatar.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= 4. FEATURE TILES ================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}
        >
          <Link to="/courses" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              style={{
                background: '#242A27',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '24px',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(124, 169, 146, 0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
            >
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎯</div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '800', color: '#E4EAE6' }}>
                Curated Learning Paths
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#9CAEA4', lineHeight: '1.5' }}>
                Dual-track modular lessons with interactive quizzes and rank progression.
              </p>
            </div>
          </Link>

          <Link to="/practice" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              style={{
                background: '#242A27',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '24px',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(124, 169, 146, 0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
            >
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚡</div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '800', color: '#E4EAE6' }}>
                Spaced Practice Studio
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#9CAEA4', lineHeight: '1.5' }}>
                Strengthen your sign recall with interactive flashcards and self-paced ratings.
              </p>
            </div>
          </Link>

          <Link to="/quiz" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              style={{
                background: '#242A27',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '24px',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(124, 169, 146, 0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
            >
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>🏆</div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '800', color: '#E4EAE6' }}>
                Ranked Quizzes
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#9CAEA4', lineHeight: '1.5' }}>
                Challenge your visual comprehension against the clock and climb leaderboard ranks.
              </p>
            </div>
          </Link>

          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              style={{
                background: '#242A27',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '24px',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(124, 169, 146, 0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
            >
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>💎</div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '800', color: '#E4EAE6' }}>
                Progress Suite
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#9CAEA4', lineHeight: '1.5' }}>
                Monitor your daily streaks, accuracy trajectories, and unlocked signer achievements.
              </p>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}