import React from 'react';

/**
 * ProgressBar Component
 * Gamified horizontal progress track with pill shape and smooth animated gradient fill.
 */
export default function ProgressBar({ currentStep = 0, totalSteps = 1, showLabel = true, height = '12px' }) {
  const safeTotal = totalSteps > 0 ? totalSteps : 1;
  const progressPercent = Math.min(100, Math.max(0, (currentStep / safeTotal) * 100));

  return (
    <div style={{ width: '100%', margin: '10px 0 16px' }}>
      {showLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: '700',
            color: '#64748b',
            marginBottom: '6px'
          }}
        >
          <span>LESSON PROGRESS</span>
          <span style={{ color: '#2563eb' }}>
            {currentStep} / {totalSteps} Completed ({Math.round(progressPercent)}%)
          </span>
        </div>
      )}

      {/* Pill-shaped Track */}
      <div
        style={{
          width: '100%',
          height: height,
          backgroundColor: '#e5e7eb',
          borderRadius: '9999px',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.08)',
          position: 'relative'
        }}
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Animated Gradient Fill */}
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(to right, #10b981, #3b82f6)',
            borderRadius: '9999px',
            transition: 'width 0.4s ease',
            boxShadow: progressPercent > 0 ? '0 1px 3px rgba(16, 185, 129, 0.4)' : 'none'
          }}
        />
      </div>
    </div>
  );
}
