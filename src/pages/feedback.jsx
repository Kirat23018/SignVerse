import React, { useState, useEffect } from 'react';

const FEEDBACK_STORAGE_KEY = 'signverse_feedback_history';

export default function Feedback() {
  const [rating, setRating] = useState('5');
  const [suggestions, setSuggestions] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) setHistory(saved);
    } catch {
      setHistory([]);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = suggestions.trim();
    if (cleaned.length < 5) {
      setError('Please enter at least 5 characters of feedback.');
      setSubmitted(false);
      return;
    }
    const entry = {
      id: Date.now(),
      rating,
      text: cleaned,
      submittedAt: new Date().toLocaleDateString()
    };
    const updated = [entry, ...history].slice(0, 10);
    setHistory(updated);
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Safe storage guard
    }
    setError('');
    setSubmitted(true);
    setSuggestions('');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 65px)', backgroundColor: '#191C1A', fontFamily: "'Inter', system-ui, sans-serif", padding: '40px 20px' }}>
      <div style={{ backgroundColor: '#242A27', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <h1 style={{ color: '#E4EAE6', fontSize: '28px', fontWeight: '800', margin: '0 0 10px 0' }}>We Value Your Feedback</h1>
        <p style={{ color: '#B5C5BC', fontSize: '15px', marginBottom: '28px' }}>
          Help us improve SignVerse! Let us know about your learning experience.
        </p>

        {error && (
          <div role="alert" style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fecaca', fontSize: '13px', fontWeight: '600', textAlign: 'left' }}>
            {error}
          </div>
        )}

        {submitted && (
          <div role="status" aria-live="polite" style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(124, 169, 146, 0.15)', border: '1px solid #7CA992', color: '#E4EAE6', fontSize: '13.5px', fontWeight: '700', textAlign: 'left' }}>
            Thank you! Your feedback has been recorded.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          <div>
            <label htmlFor="feedback-rating" style={{ fontSize: '13.5px', color: '#B5C5BC', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
              Rate your experience
            </label>
            <select
              id="feedback-rating"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.16)', backgroundColor: '#191C1A', color: '#E4EAE6', fontSize: '15px' }}
            >
              <option value="5">5 / 5 — Excellent</option>
              <option value="4">4 / 5 — Good</option>
              <option value="3">3 / 5 — Average</option>
              <option value="2">2 / 5 — Poor</option>
              <option value="1">1 / 5 — Very Bad</option>
            </select>
          </div>

          <div>
            <label htmlFor="feedback-suggestions" style={{ fontSize: '13.5px', color: '#B5C5BC', fontWeight: '700', marginBottom: '6px', display: 'block' }}>
              Your Suggestions
            </label>
            <textarea
              id="feedback-suggestions"
              rows={4}
              maxLength={1000}
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="What can we do better?"
              aria-invalid={Boolean(error)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.16)', backgroundColor: '#191C1A', color: '#E4EAE6', fontSize: '15px', resize: 'vertical' }}
              required
            />
          </div>

          <button type="submit" style={{ backgroundColor: '#7CA992', color: '#191C1A', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' }}>
            Submit Feedback
          </button>
        </form>

        {history.length > 0 && (
          <div style={{ marginTop: '24px', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: '800', color: '#A3CBB7' }}>
              Saved Feedback ({history.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.slice(0, 3).map((item) => (
                <div key={item.id} style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#191C1A', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7CA992', fontWeight: '700', marginBottom: '4px' }}>
                    <span>Rating: {item.rating} / 5</span>
                    <span style={{ color: '#9CAEA4' }}>{item.submittedAt}</span>
                  </div>
                  <div style={{ color: '#E4EAE6' }}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
