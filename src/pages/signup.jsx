import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetFreeTrial } from '../utils/subscriptionManager';

export default function Signup({ setIsAuthenticated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    resetFreeTrial();
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);

    if (setIsAuthenticated) {
      setIsAuthenticated(true);
    }

    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 65px)', backgroundColor: '#191C1A', fontFamily: "'Inter', system-ui, sans-serif", padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: '#242A27', padding: 'clamp(28px, 5vw, 44px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        
        {/* Trial Badge */}
        <span style={{ backgroundColor: 'rgba(124, 169, 146, 0.14)', border: '1px solid rgba(124, 169, 146, 0.28)', color: '#7CA992', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-block', marginBottom: '12px' }}>
          🌿 3-Day Free Trial + 50 AI Credits
        </span>

        <h1 style={{ color: '#E4EAE6', fontSize: '28px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Create Your Account</h1>
        <p style={{ color: '#9CAEA4', fontSize: '14px', marginBottom: '24px' }}>Join SignVerse and start learning with 3D avatars today</p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} onSubmit={handleSignup}>
          <input 
            type="text" 
            placeholder="Full Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '15px', outline: 'none', boxSizing: 'border-box', color: '#E4EAE6', backgroundColor: '#191C1A' }} 
            required 
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '15px', outline: 'none', boxSizing: 'border-box', color: '#E4EAE6', backgroundColor: '#191C1A' }} 
            required 
          />
          <input 
            type="password" 
            placeholder="Create Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '15px', outline: 'none', boxSizing: 'border-box', color: '#E4EAE6', backgroundColor: '#191C1A' }} 
            required 
          />

          <button 
            type="submit" 
            style={{ 
              backgroundColor: '#7CA992', color: '#191C1A', border: 'none', padding: '14px', 
              borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', 
              marginTop: '10px', transition: 'all 0.2s'
            }}
          >
            Start Learning Free ➔
          </button>
        </form>

        <div style={{ marginTop: '25px', fontSize: '14px', color: '#9CAEA4' }}>
          Already have an account? <Link to="/login" style={{ color: '#7CA992', fontWeight: '700', textDecoration: 'none' }}>Log In</Link>
        </div>
      </div>
    </div>
  );
}