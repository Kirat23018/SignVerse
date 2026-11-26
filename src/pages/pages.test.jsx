import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Translate from './translate';
import Words from './words';
import Alphabets from './alphabets';
import Practice from './practice';
import Quiz from './quiz';
import Settings from './Settings';
import Pricing from './pricing';
import Dashboard from './dashboard';

describe('Core Learning & Translation Pages', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '<sigml><hns_sign/></sigml>'
    });
  });

  it('Translate translates words, shows credit exhaustion alert, and protects against empty input', async () => {
    render(
      <MemoryRouter>
        <Translate />
      </MemoryRouter>
    );

    const translateBtn = screen.getByRole('button', { name: /translate to 3d sign language/i });
    expect(translateBtn).toBeDisabled();

    const textarea = screen.getByLabelText(/enter text to translate/i);
    fireEvent.change(textarea, { target: { value: 'hello' } });
    expect(translateBtn).not.toBeDisabled();

    fireEvent.click(translateBtn);
    expect(screen.getByRole('status')).toHaveTextContent(/Playing \[1\/1\]: Hello/i);

    // Exhaust credits and verify error alert
    localStorage.setItem('signverse_credits', '0');
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/Translation Complete/i);
    }, { timeout: 6000 });

    fireEvent.change(textarea, { target: { value: 'water' } });
    fireEvent.click(screen.getByRole('button', { name: /translate to 3d sign language/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Insufficient AI credits/i);
  }, 15000);

  it('Words filters vocabulary by search and category and displays empty state recovery', () => {
    render(<Words />);

    const searchInput = screen.getByLabelText(/search sign dictionary words/i);
    fireEvent.change(searchInput, { target: { value: 'zzzznonexistent' } });
    expect(screen.getByText(/No words match/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(screen.getByText(/SHOWING \d+ SIGNS/i)).toBeInTheDocument();

    const familyBtn = screen.getByRole('button', { name: /family & kinship/i });
    fireEvent.click(familyBtn);
    expect(familyBtn).toHaveAttribute('aria-pressed', 'true');
  }, 15000);

  it('Alphabets renders 26 letters and switches between Double and Single handed modes', () => {
    render(<Alphabets />);
    const letterZ = screen.getByRole('button', { name: 'Letter Z' });
    expect(letterZ).toBeInTheDocument();

    const singleBtn = screen.getByRole('button', { name: /single handed/i });
    fireEvent.click(singleBtn);
    expect(singleBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(letterZ);
    expect(letterZ).toHaveAttribute('aria-pressed', 'true');
  });

  it('Practice completes a 5-card flashcard session and records history', () => {
    render(<Practice />);
    fireEvent.click(screen.getByRole('button', { name: /^5 Cards/i }));

    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: /show answer/i }));
      fireEvent.click(screen.getByRole('button', { name: /yes, i knew it/i }));
    }

    expect(screen.getByRole('heading', { name: /Practice Session Finished/i })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('practiceHistory'))).toHaveLength(1);
  });

  it('Quiz plays through a 5-question round, shows accessible feedback, and saves history', () => {
    render(<Quiz />);
    fireEvent.click(screen.getByRole('button', { name: /^5 Questions/i }));

    for (let i = 0; i < 5; i++) {
      const optionBtns = screen.getAllByRole('button').filter((btn) => /^[1-4]/.test(btn.textContent || ''));
      fireEvent.click(optionBtns[0]);
      expect(screen.getByRole('status')).toBeInTheDocument();
      const nextBtn = screen.getByRole('button', { name: /next question|see final score/i });
      fireEvent.click(nextBtn);
    }

    expect(screen.getByRole('heading', { name: /Quiz Completed/i })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('quizHistory'))).toHaveLength(1);
  });

  it('Settings persists preferences to localStorage with accessible status feedback', () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const leftBtn = screen.getByRole('button', { name: /left-handed/i });
    fireEvent.click(leftBtn);
    expect(leftBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getAllByRole('button', { name: /save/i })[0]);
    expect(screen.getByRole('status')).toHaveTextContent(/saved successfully/i);
    expect(JSON.parse(localStorage.getItem('signverse_user_settings')).handPreference).toBe('left');
  });

  it('Pricing displays trial status and upgrades annual plan properly', () => {
    render(<Pricing />);
    fireEvent.click(screen.getByRole('button', { name: /choose annual pass/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/Pro Annual/i);
  });

  it('Dashboard computes zero-fabrication initial state and real user activity stats', () => {
    localStorage.clear();
    const { unmount } = render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/No quiz sessions recorded yet/i)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 4 Unlocked/i)).toBeInTheDocument();
    expect(screen.getByText(/0 signs this week/i)).toBeInTheDocument();
    unmount();

    localStorage.setItem('userName', 'Kirat');
    localStorage.setItem('quizHistory', JSON.stringify([{ id: Date.now(), date: 'Today', score: 4, total: 5 }]));
    localStorage.setItem('practiceHistory', JSON.stringify([{ id: Date.now(), date: 'Today', score: 8, total: 10 }]));
    localStorage.setItem('signverse_completed_lessons', JSON.stringify(['tts-l1-1']));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Kirat/)).toBeInTheDocument();
    expect(screen.getByText('80% across 1 quiz(zes)')).toBeInTheDocument();
    expect(screen.getByText(/15 signs this week/i)).toBeInTheDocument();
    expect(screen.getByText(/3 \/ 4 Unlocked/i)).toBeInTheDocument();
  });
});

