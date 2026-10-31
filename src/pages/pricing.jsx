import React, { useState, useEffect } from 'react';
import { getSubscriptionStatus, upgradeSubscription, resetFreeTrial } from '../utils/subscriptionManager';

export default function Pricing() {
  const [subStatus, setSubStatus] = useState(getSubscriptionStatus());
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setSubStatus(getSubscriptionStatus());
  }, []);

  const handleUpgrade = (planType) => {
    const updated = upgradeSubscription(planType);
    setSubStatus(updated);
    setSuccessMessage(`🎉 Successfully upgraded to ${updated.plan}! Unlimited access activated.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleResetTrial = () => {
    const updated = resetFreeTrial();
    setSubStatus(updated);
    setSuccessMessage('🔄 Free Trial reset to 3 Days with 50 credits for testing!');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 40px) clamp(14px, 3vw, 20px)', backgroundColor: '#191C1A', minHeight: 'calc(100vh - 65px)', fontFamily: "'Inter', system-ui, sans-serif", color: '#E4EAE6' }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        
        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ backgroundColor: 'rgba(124, 169, 146, 0.14)', border: '1px solid rgba(124, 169, 146, 0.28)', color: '#7CA992', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '800', display: 'inline-block', marginBottom: '12px' }}>
            🌿 Flexible & Accessible Pricing
          </span>
          <h1 style={{ color: '#E4EAE6', fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
            Choose the Perfect Plan for <span style={{ color: '#7CA992' }}>SignVerse</span>
          </h1>
          <p style={{ color: '#9CAEA4', fontSize: '15.5px', maxWidth: '620px', margin: '0 auto', lineHeight: '1.6' }}>
            Start with our <strong>3-Day Free Trial</strong>, then unlock unlimited 3D avatar translations, real-time camera sign recognition, and all curriculum modules.
          </p>

          {/* Current Status Notification */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            backgroundColor: '#242A27', padding: '10px 20px', borderRadius: '30px',
            border: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '20px',
            maxWidth: '100%', flexWrap: 'wrap', justifyContent: 'center'
          }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: subStatus.isPaidPlan ? '#7CA992' : subStatus.isTrialActive ? '#f59e0b' : '#ef4444' }} />
            <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#E4EAE6' }}>
              Current Status: <span style={{ color: '#7CA992' }}>{subStatus.plan}</span>
            </span>
            <span style={{ fontSize: '12px', color: '#9CAEA4', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '10px' }}>
              {subStatus.isPaidPlan ? '✨ Unlimited Access' : `⏳ ${subStatus.trialDaysRemaining} Days Left • 🪙 ${subStatus.credits} Credits`}
            </span>
          </div>

          {successMessage && (
            <div style={{
              marginTop: '16px', padding: '12px 20px', backgroundColor: 'rgba(124, 169, 146, 0.15)',
              color: '#7CA992', borderRadius: '12px', fontSize: '14px', fontWeight: '700',
              border: '1px solid #7CA992'
            }}>
              {successMessage}
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          
          {/* Plan 1: 3-Day Free Trial */}
          <div style={{
            backgroundColor: '#242A27', borderRadius: '20px', padding: '32px 28px',
            border: subStatus.isTrialActive ? '2px solid #7CA992' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex', flexDirection: 'column', position: 'relative'
          }}>
            {subStatus.isTrialActive && (
              <span style={{ position: 'absolute', top: '-12px', left: '28px', backgroundColor: '#7CA992', color: '#191C1A', fontSize: '11px', fontWeight: '800', padding: '3px 12px', borderRadius: '12px' }}>
                ACTIVE TRIAL
              </span>
            )}
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#E4EAE6', margin: '0 0 6px 0' }}>3-Day Free Trial</h3>
            <p style={{ color: '#9CAEA4', fontSize: '13.5px', margin: '0 0 20px 0' }}>Experience full 3D sign translation for free.</p>
            
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '38px', fontWeight: '800', color: '#E4EAE6' }}>$0</span>
              <span style={{ color: '#9CAEA4', fontSize: '14px', fontWeight: '600' }}> / for 3 days</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> 50 Free AI Translation Credits
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> Access to A–Z & Core Vocabulary
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> Flashcards & Timed Quizzes
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> 3D Avatar (Luna)
              </li>
            </ul>

            <button
              onClick={handleResetTrial}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#191C1A', color: '#E4EAE6', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {subStatus.isTrialActive ? `Active (${subStatus.trialDaysRemaining}d remaining)` : 'Reset Free Trial 🔄'}
            </button>
          </div>

          {/* Plan 2: Pro Monthly */}
          <div style={{
            backgroundColor: '#242A27', borderRadius: '20px', padding: '32px 28px',
            border: '2px solid #7CA992',
            display: 'flex', flexDirection: 'column', position: 'relative'
          }}>
            <span style={{ position: 'absolute', top: '-12px', right: '28px', background: '#7CA992', color: '#191C1A', fontSize: '11px', fontWeight: '800', padding: '4px 14px', borderRadius: '12px' }}>
              POPULAR CHOICE 🌿
            </span>

            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#E4EAE6', margin: '0 0 6px 0' }}>Pro Monthly</h3>
            <p style={{ color: '#9CAEA4', fontSize: '13.5px', margin: '0 0 20px 0' }}>Ideal for daily learners and educators.</p>
            
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '42px', fontWeight: '800', color: '#7CA992' }}>₹199</span>
              <span style={{ color: '#9CAEA4', fontSize: '14px', fontWeight: '600' }}> / month</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6', fontWeight: '600' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> <strong>All 30 Academy Course Modules</strong>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6', fontWeight: '600' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> <strong>Dynamic 3D Fingerspelling Engine</strong>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> Real-Time AI Camera Feedback
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> All 5 Avatars (Luna, Marc, Anna, Siggi, Francoise)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> Verified Completion Certificate
              </li>
            </ul>

            <button
              onClick={() => handleUpgrade('monthly')}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: '#7CA992',
                color: '#191C1A', fontSize: '15px', fontWeight: '800',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {subStatus.plan.includes('₹199') || subStatus.plan.includes('$5') ? 'Current Plan ✅' : 'Upgrade to Pro (₹199/mo) ➔'}
            </button>
          </div>

          {/* Plan 3: Pro Annual */}
          <div style={{
            backgroundColor: '#242A27', borderRadius: '20px', padding: '32px 28px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex', flexDirection: 'column', position: 'relative'
          }}>
            <span style={{ position: 'absolute', top: '-12px', right: '28px', backgroundColor: '#7CA992', color: '#191C1A', fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '12px' }}>
              SAVE 38%
            </span>

            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#E4EAE6', margin: '0 0 6px 0' }}>Pro Annual</h3>
            <p style={{ color: '#9CAEA4', fontSize: '13.5px', margin: '0 0 20px 0' }}>Best value for committed signers.</p>
            
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '42px', fontWeight: '800', color: '#E4EAE6' }}>₹1,499</span>
              <span style={{ color: '#9CAEA4', fontSize: '14px', fontWeight: '600' }}> / year</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> <strong>Everything in Pro Monthly</strong>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> Priority Groq LLM Assistant Access
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> Offline Dictionary Downloads
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#E4EAE6' }}>
                <span style={{ color: '#7CA992', fontWeight: 'bold' }}>✓</span> Equivalent to only ₹125/month
              </li>
            </ul>

            <button
              onClick={() => handleUpgrade('annual')}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: '#191C1A', color: '#E4EAE6', fontSize: '15px', fontWeight: '700',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {subStatus.plan.includes('₹1,499') || subStatus.plan.includes('$60') ? 'Current Plan ✅' : 'Choose Annual Pass (₹1,499) ➔'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
