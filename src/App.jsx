import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import './App.css';

import Home from './pages/home';
import TextToSignHub from './pages/TextToSignHub';
import LiveCam from './pages/LiveCam';
import SignToText from './pages/SignToText';
import Courses from './pages/Courses';
import TextToSignLesson from './pages/TextToSignLesson';
import Alphabets from './pages/alphabets';
import Words from './pages/words';
import Translate from './pages/translate';
import Practice from './pages/practice';
import Quiz from './pages/quiz';
import Dashboard from './pages/dashboard';
import Settings from './pages/Settings';
import Pricing from './pages/pricing';
import Login from './pages/login';
import Signup from './pages/signup';
import LessonEngine from './components/LessonEngine';
import AIChatBot from './components/AIChatBot';

// Accessible, Soothing 'Sage & Muted Slate' Navigation Bar
function NavigationBar({ isAuthenticated, handleLogout }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinkStyle = (path) => ({
    color: isActive(path) ? '#E4EAE6' : '#9CAEA4',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive(path) ? '700' : '500',
    padding: '8px 16px',
    borderRadius: '12px',
    background: isActive(path) ? 'rgba(124, 169, 146, 0.16)' : 'transparent',
    border: isActive(path) ? '1px solid rgba(124, 169, 146, 0.28)' : '1px solid transparent',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });

  return (
    <nav
      className="signverse-navbar-wrapper"
      style={{
        backgroundColor: 'rgba(36, 42, 39, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        height: '65px',
        width: '100%'
      }}
    >
      {/* 1. Left: The Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link
          to="/"
          style={{
            color: '#E4EAE6',
            textDecoration: 'none',
            fontSize: '21px',
            fontWeight: '900',
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '24px' }}>🤟</span>
          <span>
            Sign<span style={{ color: '#7CA992' }}>Verse</span>
          </span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#7CA992',
              display: 'inline-block',
              marginLeft: '2px'
            }}
          />
        </Link>
      </div>

      {/* 2. Middle: Clean uncluttered navigation ONLY containing Home, Courses, Dashboard, Settings */}
      <div
        className="signverse-nav-links-desktop"
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}
      >
        <Link to="/" style={navLinkStyle('/')}>
          <span>Home</span>
        </Link>
        <Link
          to="/courses"
          style={{
            ...navLinkStyle('/courses'),
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>Courses</span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: '800',
              padding: '2px 7px',
              borderRadius: '6px',
              background: 'rgba(124, 169, 146, 0.18)',
              color: '#7CA992',
              border: '1px solid rgba(124, 169, 146, 0.32)',
              letterSpacing: '0.4px',
              textTransform: 'uppercase'
            }}
          >
            Dual Track
          </span>
        </Link>
        <Link to="/dashboard" style={navLinkStyle('/dashboard')}>
          <span>Dashboard</span>
        </Link>
        <Link to="/settings" style={navLinkStyle('/settings')}>
          <span>Settings</span>
        </Link>
      </div>

      {/* 3. Right: Login / Sign Up buttons or Logout */}
      <div className="signverse-nav-auth-desktop" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  background: 'rgba(124, 169, 146, 0.12)',
                  border: '1px solid rgba(124, 169, 146, 0.25)',
                  color: '#7CA992',
                  fontSize: '13px',
                  fontWeight: '700'
                }}
              >
                <span>👤</span>
                <span>Profile</span>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '7px 16px',
                borderRadius: '10px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  backgroundColor: 'transparent',
                  color: '#9CAEA4',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '7px 18px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#E4EAE6';
                  e.currentTarget.style.borderColor = 'rgba(124, 169, 146, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9CAEA4';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                Login
              </button>
            </Link>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  backgroundColor: '#7CA992',
                  color: '#191C1A',
                  border: '1px solid rgba(124, 169, 146, 0.5)',
                  padding: '7px 18px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s'
                }}
              >
                Sign Up
              </button>
            </Link>
          </>
        )}
      </div>

      {/* Mobile Drawer Toggle */}
      <button
        className="signverse-nav-mobile-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation menu"
        style={{ color: '#E4EAE6', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div
          className="signverse-nav-drawer"
          style={{
            position: 'absolute',
            top: '65px',
            left: 0,
            width: '100%',
            backgroundColor: '#242A27',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backdropFilter: 'blur(16px)'
          }}
        >
          <Link to="/" style={navLinkStyle('/')} onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link to="/courses" style={navLinkStyle('/courses')} onClick={() => setIsMobileMenuOpen(false)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Courses</span>
              <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 7px', borderRadius: '6px', background: 'rgba(124, 169, 146, 0.18)', color: '#7CA992' }}>
                Dual Track
              </span>
            </div>
          </Link>
          <Link to="/dashboard" style={navLinkStyle('/dashboard')} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
          <Link to="/settings" style={navLinkStyle('/settings')} onClick={() => setIsMobileMenuOpen(false)}>Settings</Link>

          <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)', margin: '6px 0' }} />

          {isAuthenticated ? (
            <button
              onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
              style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              Logout
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login" style={{ flex: 1, textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>
                <button style={{ width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#9CAEA4', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontWeight: '700' }}>Login</button>
              </Link>
              <Link to="/signup" style={{ flex: 1, textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>
                <button style={{ width: '100%', padding: '10px', backgroundColor: '#7CA992', color: '#191C1A', border: 'none', borderRadius: '12px', fontWeight: '800' }}>Sign Up</button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loggedInStatus = localStorage.getItem('isLoggedIn');
    if (loggedInStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isLoggedIn');
  };

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#191C1A', color: '#E4EAE6' }}>
        <NavigationBar isAuthenticated={isAuthenticated} handleLogout={handleLogout} />

        <div style={{ flex: 1 }}>
          <Routes>
            {/* 1. Home Landing Page (Acts as hub for Text-to-Sign & Sign-to-Text) */}
            <Route path="/" element={<Home />} />

            {/* 2. Text-to-Sign Hub & Features */}
            <Route path="/text-to-sign" element={<TextToSignHub />} />
            <Route path="/text-to-sign/alphabets" element={<Alphabets />} />
            <Route path="/text-to-sign/words" element={<Words />} />
            <Route path="/text-to-sign/translate" element={<Translate />} />
            <Route path="/text-to-sign/practice" element={<Practice />} />
            <Route path="/text-to-sign/quiz" element={<Quiz />} />
            <Route path="/text-to-sign/dashboard" element={<Dashboard />} />

            {/* 3. Sign-to-Text LiveCam Studio */}
            <Route path="/sign-to-text" element={<LiveCam />} />
            <Route path="/camera-mode" element={<SignToText />} />
            <Route path="/signtotext" element={<SignToText />} />

            {/* 4. Soothing Sage Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* 5. System Settings */}
            <Route path="/settings" element={<Settings />} />

            {/* Courses & Lessons */}
            <Route path="/courses" element={<Courses />} />
            <Route path="/course" element={<Courses />} />
            <Route path="/courses/text-to-sign/:courseId/:lessonId" element={<TextToSignLesson />} />
            <Route path="/courses/text-to-sign/:lessonId" element={<TextToSignLesson />} />
            <Route path="/course/text-to-sign/:lessonId" element={<TextToSignLesson />} />
            <Route path="/text-to-sign/lesson/:lessonId" element={<TextToSignLesson />} />
            <Route path="/course/:levelId" element={<LessonEngine />} />

            {/* Direct Tool Routes */}
            <Route path="/alphabets" element={<Alphabets />} />
            <Route path="/words" element={<Words />} />
            <Route path="/translate" element={<Translate />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/quiz" element={<Quiz />} />

            {/* Auth & Pricing Routes */}
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/signup" element={<Signup setIsAuthenticated={setIsAuthenticated} />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Global Floating AI Chatbot */}
        <AIChatBot />
      </div>
    </Router>
  );
}
