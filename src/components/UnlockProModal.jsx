import React, { useState } from 'react';
import { unlockProCourseSubscription } from '../utils/subscriptionManager';

export default function UnlockProModal({ isOpen, onClose, onUnlocked, targetModuleName = 'Masterclass Module' }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // 'monthly' | 'yearly'
  const [paymentTab, setPaymentTab] = useState('card'); // 'card' | 'upi'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Mock Form Fields
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState('Kirat Singh');
  const [upiId, setUpiId] = useState('kirat@oksbi');

  if (!isOpen) return null;

  const price = selectedPlan === 'monthly' ? '₹199' : '₹1,499';
  const period = selectedPlan === 'monthly' ? '/ month' : '/ year';

  const handlePay = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      // Persist unlock
      unlockProCourseSubscription(`SignVerse Pro (${selectedPlan === 'monthly' ? '₹199/mo' : '₹1499/yr'})`);

      setTimeout(() => {
        setIsSuccess(false);
        if (onUnlocked) onUnlocked();
        onClose();
      }, 1200);
    }, 1800);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(25, 28, 26, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#242A27',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          position: 'relative',
          color: '#E4EAE6'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#9CAEA4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '15px',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#E4EAE6'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#9CAEA4'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div
          style={{
            background: '#191C1A',
            padding: '28px 32px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(124, 169, 146, 0.12)',
              border: '1px solid rgba(124, 169, 146, 0.25)',
              color: '#7CA992',
              fontSize: '11.5px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '10px'
            }}
          >
            <span>🌿 SIGNVERSE PRO ACADEMY</span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px 0', color: '#E4EAE6', letterSpacing: '-0.5px' }}>
            Unlock Pro Curriculum
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#9CAEA4' }}>
            {targetModuleName ? `To access ${targetModuleName}, an active Pro Membership is required.` : 'Lesson 6 onwards requires an active Pro Membership.'} Unlock all 30 Avatar & Camera Modules instantly.
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 32px 32px' }}>
          
          {/* Plan Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
            {/* Monthly */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              style={{
                borderRadius: '14px',
                padding: '16px',
                backgroundColor: selectedPlan === 'monthly' ? 'rgba(124, 169, 146, 0.12)' : '#191C1A',
                border: selectedPlan === 'monthly' ? '1.5px solid #7CA992' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: '12px', color: '#9CAEA4', fontWeight: '700', textTransform: 'uppercase' }}>Monthly Pass</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#E4EAE6', marginTop: '4px' }}>
                ₹199 <span style={{ fontSize: '13px', color: '#9CAEA4', fontWeight: '600' }}>/mo</span>
              </div>
              <div style={{ fontSize: '11px', color: '#7CA992', marginTop: '2px' }}>Cancel anytime</div>
            </div>

            {/* Yearly */}
            <div
              onClick={() => setSelectedPlan('yearly')}
              style={{
                borderRadius: '14px',
                padding: '16px',
                backgroundColor: selectedPlan === 'yearly' ? 'rgba(124, 169, 146, 0.12)' : '#191C1A',
                border: selectedPlan === 'yearly' ? '1.5px solid #7CA992' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <span style={{ position: 'absolute', top: '-10px', right: '12px', background: '#7CA992', color: '#191C1A', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '10px' }}>
                SAVE 38%
              </span>
              <div style={{ fontSize: '12px', color: '#9CAEA4', fontWeight: '700', textTransform: 'uppercase' }}>Annual Pass</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#E4EAE6', marginTop: '4px' }}>
                ₹1,499 <span style={{ fontSize: '13px', color: '#9CAEA4', fontWeight: '600' }}>/yr</span>
              </div>
              <div style={{ fontSize: '11px', color: '#7CA992', marginTop: '2px' }}>Only ₹125/month</div>
            </div>
          </div>

          {/* Perks Summary */}
          <div style={{ background: '#191C1A', borderRadius: '14px', padding: '14px 18px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '22px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#7CA992', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
              PRO PASS INCLUDES:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px', color: '#E4EAE6' }}>
              <div>✓ All 30 Course Modules</div>
              <div>✓ 3D Avatar Dictionary</div>
              <div>✓ Real-time AI Camera Recognition</div>
              <div>✓ Verified Certificate</div>
            </div>
          </div>

          {/* Dummy Stripe / Razorpay UI Box */}
          <div style={{ background: '#191C1A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '18px', marginBottom: '22px' }}>
            {/* Gateway Toggle Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setPaymentTab('card')}
                style={{
                  background: paymentTab === 'card' ? 'rgba(124, 169, 146, 0.15)' : 'transparent',
                  color: paymentTab === 'card' ? '#7CA992' : '#9CAEA4',
                  border: paymentTab === 'card' ? '1px solid rgba(124, 169, 146, 0.3)' : 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>💳 Card (Stripe Checkout)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('upi')}
                style={{
                  background: paymentTab === 'upi' ? 'rgba(124, 169, 146, 0.15)' : 'transparent',
                  color: paymentTab === 'upi' ? '#7CA992' : '#9CAEA4',
                  border: paymentTab === 'upi' ? '1px solid rgba(124, 169, 146, 0.3)' : 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📱 UPI / QR (Razorpay)</span>
              </button>
            </div>

            {paymentTab === 'card' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '700', display: 'block', marginBottom: '4px' }}>CARD NUMBER</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#242A27',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#E4EAE6',
                      fontSize: '13.5px',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '700', display: 'block', marginBottom: '4px' }}>EXPIRY</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#242A27',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#E4EAE6',
                        fontSize: '13.5px',
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '700', display: 'block', marginBottom: '4px' }}>CVC</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: '#242A27',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#E4EAE6',
                        fontSize: '13.5px',
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '700', display: 'block', marginBottom: '4px' }}>NAME ON CARD</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#242A27',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#E4EAE6',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#9CAEA4', fontWeight: '700', display: 'block', marginBottom: '4px' }}>VIRTUAL PAYMENT ADDRESS (UPI ID)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="example@okaxis"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#242A27',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#E4EAE6',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ fontSize: '11.5px', color: '#9CAEA4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚡ Instant approval via Google Pay / PhonePe / Paytm</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handlePay}
            disabled={isProcessing || isSuccess}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '12px',
              border: 'none',
              background: '#7CA992',
              color: '#191C1A',
              fontSize: '15px',
              fontWeight: '800',
              cursor: isProcessing || isSuccess ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}
          >
            {isProcessing ? (
              <>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: '2px solid #191C1A',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
                <span>Processing Sandbox Payment...</span>
              </>
            ) : isSuccess ? (
              <>
                <span>✓ Payment Successful! Unlocking Modules...</span>
              </>
            ) : (
              <>
                <span>Proceed to Payment ({price} {period}) ➔</span>
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: '#9CAEA4' }}>
            🔒 256-Bit SSL Encrypted • Powered by Stripe & Razorpay Sandbox Mode
          </div>
        </div>
      </div>
    </div>
  );
}
