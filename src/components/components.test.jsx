import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import AIChatBot from './AIChatBot';
import CWASA3DAvatar from './CWASA3DAvatar';
import ErrorBoundary from './ErrorBoundary';
import UnlockProModal from './UnlockProModal';
import Login from '../pages/login';
import Signup from '../pages/signup';
import Feedback from '../pages/feedback';

describe('App routing and semantic layout', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '<sigml></sigml>',
      json: async () => ({ fallback: true })
    });
  });

  it('renders skip link, primary navigation, main landmark, and navigates across routes', async () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Break Communication Barriers/i);

    fireEvent.click(screen.getByRole('link', { name: /settings/i }));
    expect(await screen.findByRole('heading', { name: /System Settings/i }, { timeout: 8000 })).toBeInTheDocument();
  }, 15000);

  it('toggles mobile navigation drawer with aria-expanded and closes on Escape', () => {
    render(<App />);
    const toggle = screen.getByRole('button', { name: /open navigation menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('mobile-nav-drawer')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('AIChatBot', () => {
  it('opens dialog, submits query to /api/chat with fallback, and closes on Escape', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ fallback: true })
    });

    render(
      <MemoryRouter>
        <AIChatBot />
      </MemoryRouter>
    );

    const trigger = screen.getByRole('button', { name: /open signbot ai assistant/i });
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: /signbot ai assistant/i });
    expect(dialog).toBeInTheDocument();

    const input = screen.getByLabelText(/ask signbot a question/i);
    fireEvent.change(input, { target: { value: 'What is SignVerse?' } });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/3D Sign Language Learning & Translation Platform/i)).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /signbot ai assistant/i })).not.toBeInTheDocument();
  });
});

describe('CWASA3DAvatar', () => {
  it('renders iframe, toggles playback speed, and dispatches same-origin replay postMessage', () => {
    render(<CWASA3DAvatar sigml="SignFiles/hello.sigml" title="Hello 3D Avatar" />);

    const iframe = screen.getByTitle('Hello 3D Avatar');
    const postMessage = vi.fn();
    Object.defineProperty(iframe, 'contentWindow', { value: { postMessage }, configurable: true });

    const speedBtn = screen.getByRole('button', { name: /toggle playback speed/i });
    expect(speedBtn).toHaveTextContent(/Normal \(1\.0x\)/i);
    fireEvent.click(speedBtn);
    expect(speedBtn).toHaveTextContent(/Slow \(1\.5x\)/i);

    const replayBtn = screen.getByRole('button', { name: /replay hello 3d avatar sign animation/i });
    fireEvent.click(replayBtn);
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PLAY_SIGML', file: 'SignFiles/hello.sigml' }),
      window.location.origin
    );
  });
});

describe('UnlockProModal', () => {
  it('validates card/UPI input accessibly and closes on Escape', () => {
    const onClose = vi.fn();
    render(<UnlockProModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    const cardInput = screen.getByLabelText(/card number/i);
    fireEvent.change(cardInput, { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /proceed to sandbox payment/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/valid demo card number/i);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Auth & Feedback forms', () => {
  it('validates Login credentials and authenticates valid submissions', () => {
    const setAuth = vi.fn();
    render(
      <MemoryRouter>
        <Login setIsAuthenticated={setAuth} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i);
    expect(setAuth).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@signverse.org' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(setAuth).toHaveBeenCalledWith(true);
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
  });

  it('validates Signup fields and avoids storing raw email/password in localStorage', () => {
    const setAuth = vi.fn();
    render(
      <MemoryRouter>
        <Signup setIsAuthenticated={setAuth} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Alex Signer' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText(/create password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /start learning free/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i);

    fireEvent.change(screen.getByLabelText(/create password/i), { target: { value: 'StrongPass123' } });
    fireEvent.click(screen.getByRole('button', { name: /start learning free/i }));

    expect(setAuth).toHaveBeenCalledWith(true);
    expect(localStorage.getItem('userName')).toBe('Alex Signer');
    expect(localStorage.getItem('userEmail')).toBeNull();
  });

  it('validates Feedback form and shows inline status confirmation', () => {
    render(<Feedback />);
    fireEvent.change(screen.getByLabelText(/your suggestions/i), { target: { value: 'hi' } });
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 5 characters/i);

    fireEvent.change(screen.getByLabelText(/your suggestions/i), { target: { value: 'Love the 3D avatars!' } });
    fireEvent.click(screen.getByRole('button', { name: /submit feedback/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/thank you/i);
  });

  it('catches rendering errors gracefully in ErrorBoundary and supports reset', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;
    function BuggyWidget() {
      if (shouldThrow) throw new Error('Simulated crash');
      return <div>Recovered view</div>;
    }

    render(
      <ErrorBoundary>
        <BuggyWidget />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    expect(screen.getByText(/simulated crash/i)).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('Recovered view')).toBeInTheDocument();
    errSpy.mockRestore();
  });
});

