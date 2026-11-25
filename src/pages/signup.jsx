import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetFreeTrial } from '../utils/subscriptionManager';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup({ setIsAuthenticated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    const cleanName = Array.from(name)
      .filter((ch) => {
        const code = ch.charCodeAt(0);
        return code >= 32 && code !== 127;
      })
      .join('')
      .trim();
    const cleanEmail = email.trim();

    if (cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError('');
    resetFreeTrial();
    try {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', cleanName.slice(0, 80));
    } catch {
      // Ignore storage errors
    }

    if (setIsAuthenticated) {
      setIsAuthenticated(true);
    }

    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 65px)', backgroundColor: '#191C1A', fontFamily: "'Inter', system-ui, sans-serif", padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: '#242A27', padding: 'clamp(28px, 5vw, 44px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <span style={{ backgroundColor: 'rgba(124, 169, 146, 0.14)', border: '1px solid rgba(124, 169, 146, 0.28)', color: '#A3C7B5', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-block', marginBottom: '12px' }}>
          <span aria-hidden="true">🌿 </span>3-Day Free Trial + 50 AI Credits
        </span>

        <h1 style={{ color: '#E4EAE6', fontSize: '28px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Create Your Account</h1>
        <p style={{ color: '#B5C5BC', fontSize: '14px', marginBottom: '22px' }}>Join SignVerse and start learning with 3D avatars today</p>

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

        <form style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }} onSubmit={handleSignup} noValidate>
          <div>
            <label htmlFor="signup-name" style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#B5C5BC', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(error && name.trim().length < 2)}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.16)', fontSize: '15px', boxSizing: 'border-box', color: '#E4EAE6', backgroundColor: '#191C1A' }}
              required
            />
          </div>

          <div>
            <label htmlFor="signup-email" style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#B5C5BC', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(error && !EMAIL_REGEX.test(email.trim()))}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.16)', fontSize: '15px', boxSizing: 'border-box', color: '#E4EAE6', backgroundColor: '#191C1A' }}
              required
            />
          </div>

          <div>
            <label htmlFor="signup-password" style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#B5C5BC', marginBottom: '6px' }}>
              Create Password (min. 8 characters)
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(error && password.length < 8)}
              style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.16)', fontSize: '15px', boxSizing: 'border-box', color: '#E4EAE6', backgroundColor: '#191C1A' }}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: '#7CA992', color: '#191C1A', border: 'none', padding: '14px',
              borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer',
              marginTop: '10px', transition: 'all 0.2s'
            }}
          >
            Start Learning Free <span aria-hidden="true">➔</span>
          </button>
        </form>

        <div style={{ marginTop: '25px', fontSize: '14px', color: '#B5C5BC' }}>
          Already have an account? <Link to="/login" style={{ color: '#A3C7B5', fontWeight: '700', textDecoration: 'none' }}>Log In</Link>
        </div>
      </div>
    </div>
  );
}
