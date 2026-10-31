import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { updateStreak } from '../utils/streakManager';
import { getSubscriptionStatus } from '../utils/subscriptionManager';

export default function Login({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsAuthenticated(true);
    localStorage.setItem('isLoggedIn', 'true');
    getSubscriptionStatus();
    updateStreak();
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 65px)', backgroundColor: '#191C1A', fontFamily: "'Inter', system-ui, sans-serif", padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: '#242A27', padding: 'clamp(28px, 5vw, 44px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ color: '#E4EAE6', fontSize: '28px', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Welcome Back!</h1>
        <p style={{ color: '#9CAEA4', fontSize: '14px', marginBottom: '30px' }}>Login to access your 3D Sign Language Hub</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: '#191C1A', color: '#E4EAE6', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: '#191C1A', color: '#E4EAE6', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} 
          />
          <button 
            type="submit" 
            style={{ backgroundColor: '#7CA992', color: '#191C1A', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginTop: '10px', transition: 'all 0.2s' }}
          >
            Login
          </button>
        </form>

        <div style={{ marginTop: '25px', fontSize: '14px', color: '#9CAEA4' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#7CA992', fontWeight: '700', textDecoration: 'none' }}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
}