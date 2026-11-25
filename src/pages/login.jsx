import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { updateStreak } from '../utils/streakManager';
import { getSubscriptionStatus } from '../utils/subscriptionManager';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (localStorage.getItem('isLoggedIn') === 'true') {
        setIsAuthenticated?.(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, [setIsAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setIsAuthenticated(true);
    try {
      localStorage.setItem('isLoggedIn', 'true');
    } catch {
      // Ignore storage errors
    }
    getSubscriptionStatus();
    updateStreak();
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 65px)', backgroundColor: '#191C1A', fontFamily: "'Inter', system-ui, sans-serif", padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: '#242A27', padding: 'clamp(28px, 5vw, 44px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ color: '#E4EAE6', fontSize: '28px', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Welcome Back!</h1>
        <p style={{ color: '#B5C5BC', fontSize: '14px', marginBottom: '26px' }}>Login to access your 3D Sign Language Hub</p>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: '16px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fecaca',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          <div>
            <label htmlFor="login-email" style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#B5C5BC', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error && !EMAIL_REGEX.test(email.trim()))}
              required
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.16)', backgroundColor: '#191C1A', color: '#E4EAE6', fontSize: '15px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label htmlFor="login-password" style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#B5C5BC', marginBottom: '6px' }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error && password.length < 6)}
              required
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.16)', backgroundColor: '#191C1A', color: '#E4EAE6', fontSize: '15px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            style={{ backgroundColor: '#7CA992', color: '#191C1A', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginTop: '10px', transition: 'all 0.2s' }}
          >
            Login
          </button>
        </form>

        <div style={{ marginTop: '25px', fontSize: '14px', color: '#B5C5BC' }}>
          Don&apos;t have an account? <Link to="/signup" style={{ color: '#A3C7B5', fontWeight: '700', textDecoration: 'none' }}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
