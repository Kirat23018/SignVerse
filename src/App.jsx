import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import './App.css';

import Home from './pages/home';
import Alphabets from './pages/alphabets';
import Words from './pages/words';
import Translate from './pages/translate';
import Practice from './pages/practice';
import Quiz from './pages/quiz';
import Dashboard from './pages/dashboard';
import Pricing from './pages/pricing';
import Login from './pages/login';
import Signup from './pages/signup';
import CoursePage from './pages/CoursePage';
import LessonEngine from './components/LessonEngine';
import AIChatBot from './components/AIChatBot';
import { getSubscriptionStatus } from './utils/subscriptionManager';

// Navbar Component with Credits & 3-Day Trial Badge
function NavigationBar({ isAuthenticated, handleLogout }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [subStatus, setSubStatus] = useState(getSubscriptionStatus());

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setSubStatus(getSubscriptionStatus());
  }, [location.pathname]);

  const linkStyle = (path) => ({
    color: 'white',
    textDecoration: 'none',
    fontSize: '14.5px',
    fontWeight: isActive(path) ? 'bold' : '500',
    borderBottom: isActive(path) ? '2px solid #38bdf8' : 'none',
    paddingBottom: '2px',
    transition: 'all 0.2s ease-in-out'
  });

  return (
    <nav 
      className="signverse-navbar-wrapper"
      style={{
        backgroundColor: '#004080',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        minHeight: '56px',
        width: '100%'
      }}
    >
      {/* Brand & Badge */}
      <div className="signverse-nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <Link to="/" className="signverse-nav-logo" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '21px', fontWeight: '800', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          SignVerse 🤟
        </Link>

        {/* 3-Day Trial & Credits Badge */}
        <Link to="/pricing" style={{ textDecoration: 'none' }}>
          <div className="signverse-nav-badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.16)', color: '#ffffff', padding: '3px 9px', borderRadius: '14px', fontSize: '11.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255, 255, 255, 0.22)', whiteSpace: 'nowrap' }}>
            <span>🪙 {subStatus.credits}</span>
            <span style={{ opacity: 0.7 }}>•</span>
            <span>{subStatus.isPaidPlan ? 'Pro ✨' : `Trial: ${subStatus.trialDaysRemaining}d`}</span>
          </div>
        </Link>
      </div>

      {/* Desktop Links (Visible on desktop > 920px) */}
      <div className="signverse-nav-links-desktop" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <Link to="/" style={linkStyle('/')}>Home</Link>
        <Link to="/pricing" style={linkStyle('/pricing')}>Pricing 💎</Link>
        
        {/* Protected Links (Logged in users only) */}
        {isAuthenticated && (
          <>
            <Link to="/alphabets" style={linkStyle('/alphabets')}>Alphabets</Link>
            <Link to="/words" style={linkStyle('/words')}>Words</Link>
            <Link to="/translate" style={linkStyle('/translate')}>3D Translate</Link>
            <Link to="/course" style={linkStyle('/course')}>Courses 🎯</Link>
            <Link to="/practice" style={linkStyle('/practice')}>Practice</Link>
            <Link to="/quiz" style={linkStyle('/quiz')}>Quiz</Link>
            <Link to="/dashboard" style={linkStyle('/dashboard')}>Dashboard</Link>
          </>
        )}
      </div>

      {/* Desktop Auth Buttons (Visible on desktop > 920px) */}
      <div className="signverse-nav-auth-desktop" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {isAuthenticated ? (
          <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13.5px' }}>
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={{ backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.6)', padding: '7px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13.5px' }}>Login</button>
            </Link>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <button style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13.5px' }}>Sign Up</button>
            </Link>
          </>
        )}
      </div>

      {/* Mobile Hamburger Button (Visible only on mobile <= 920px via CSS) */}
      <button 
        className="signverse-nav-mobile-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div className="signverse-nav-drawer">
          <Link to="/" className={`signverse-nav-drawer-link ${isActive('/') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link to="/pricing" className={`signverse-nav-drawer-link ${isActive('/pricing') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Pricing 💎</Link>
          
          {isAuthenticated && (
            <>
              <div className="signverse-nav-drawer-divider" />
              <Link to="/alphabets" className={`signverse-nav-drawer-link ${isActive('/alphabets') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Alphabets (A-Z)</Link>
              <Link to="/words" className={`signverse-nav-drawer-link ${isActive('/words') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Sign Dictionary & Words</Link>
              <Link to="/translate" className={`signverse-nav-drawer-link ${isActive('/translate') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>3D Translate (Voice & Text)</Link>
              <Link to="/course" className={`signverse-nav-drawer-link ${isActive('/course') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Gamified Courses 🎯</Link>
              <Link to="/practice" className={`signverse-nav-drawer-link ${isActive('/practice') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Practice Studio</Link>
              <Link to="/quiz" className={`signverse-nav-drawer-link ${isActive('/quiz') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Interactive Quiz</Link>
              <Link to="/dashboard" className={`signverse-nav-drawer-link ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>Dashboard & Progress</Link>
            </>
          )}

          <div className="signverse-nav-drawer-divider" />
          {isAuthenticated ? (
            <button 
              onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} 
              style={{ width: '100%', padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '15px' }}
            >
              Logout
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Link to="/login" style={{ flex: 1, textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>
                <button style={{ width: '100%', backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.6)', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Login</button>
              </Link>
              <Link to="/signup" style={{ flex: 1, textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>
                <button style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Sign Up</button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

// Protected Route Component
const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

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
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <NavigationBar isAuthenticated={isAuthenticated} handleLogout={handleLogout} />
        
        <div style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/signup" element={<Signup setIsAuthenticated={setIsAuthenticated} />} />
            
            {/* Protected Routes */}
            <Route path="/alphabets" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Alphabets /></ProtectedRoute>} />
            <Route path="/words" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Words /></ProtectedRoute>} />
            <Route path="/translate" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Translate /></ProtectedRoute>} />
            <Route path="/course" element={<ProtectedRoute isAuthenticated={isAuthenticated}><CoursePage /></ProtectedRoute>} />
            <Route path="/course/:levelId" element={<ProtectedRoute isAuthenticated={isAuthenticated}><LessonEngine /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Practice /></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Quiz /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Dashboard /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

        {/* Global AI Assistant Floating Bot */}
        <AIChatBot />
      </div>
    </Router>
  );
}
