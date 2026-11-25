import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  askGeminiRealtime,
  getLocalBotResponse,
  isSafeInternalRoute
} from './aiBotEngine';
import {
  cleanSiGML,
  resolveSigmlPath,
  fetchAndCacheSiGML,
  playSiGMLFast,
  getAllVocabulary,
  getQuizVocabulary
} from './sigmlService';
import {
  normalizeLandmarks,
  detectSentenceComponent,
  checkTokenMatchesStep,
  TARGET_SENTENCES
} from './sentenceEngine';
import {
  getSubscriptionStatus,
  deductCredits,
  addCredits,
  upgradeSubscription,
  isProUnlocked,
  unlockProCourseSubscription,
  resetFreeTrial
} from './subscriptionManager';
import { updateStreak, getStreak } from './streakManager';

describe('aiBotEngine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects empty queries cleanly without network call', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await askGeminiRealtime('   ');
    expect(res.isRealtimeAI).toBe(false);
    expect(res.text).toMatch(/enter a question/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('routes requests through /api/chat and falls back to local KB on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Offline'));
    const res = await askGeminiRealtime('What is SignVerse?');
    expect(res.isRealtimeAI).toBe(false);
    expect(res.text).toContain('SignVerse');
    expect(res.action).toEqual({ label: 'Try 3D Translator', route: '/translate' });
  });

  it('rejects unsafe external action routes from /api/chat responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        text: 'Safe answer',
        action: { label: 'Bad', route: 'https://phishing.example' },
        isRealtimeAI: true,
        provider: 'Groq AI ⚡'
      })
    });
    const res = await askGeminiRealtime('Hello');
    expect(res.text).toBe('Safe answer');
    expect(res.action).toBeNull();
    expect(isSafeInternalRoute('/dashboard')).toBe(true);
    expect(isSafeInternalRoute('https://phishing.example')).toBe(false);
  });

  it('handles local knowledge base keyword matching', () => {
    const res = getLocalBotResponse('Tell me about pricing');
    expect(res.action?.route).toBe('/pricing');
    expect(res.isRealtimeAI).toBe(false);
  });
});

describe('sigmlService', () => {
  it('sanitizes UTF-8 BOM, XML declarations, and rogue comments in SiGML', () => {
    const dirty = '\uFEFF<?xml version="1.0"?><!-- bad --><sigml>--><hns_sign/></sigml>trailing';
    expect(cleanSiGML(dirty)).toBe('<sigml><hns_sign/></sigml>');
    expect(cleanSiGML('')).toBe('');
  });

  it('resolves valid relative paths and rejects traversal or external URLs', () => {
    expect(resolveSigmlPath('/hello')).toBe('SignFiles/hello.sigml');
    expect(resolveSigmlPath('DictionarySigns/alphabets_single_handed/a.sigml')).toBe(
      'DictionarySigns/alphabets_single_handed/a.sigml'
    );
    expect(resolveSigmlPath('../etc/passwd')).toBe('');
    expect(resolveSigmlPath('https://evil.com/x.sigml')).toBe('');
    expect(resolveSigmlPath('javascript:alert(1)')).toBe('');
  });

  it('fetches, sanitizes, and caches SiGML content and handles HTTP failures gracefully', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      text: async () => '\uFEFF<sigml><hns_sign gloss="TEST_UNIQUE"/></sigml>'
    });

    const first = await fetchAndCacheSiGML('unique_test_sign_123');
    const second = await fetchAndCacheSiGML('unique_test_sign_123');
    expect(first).toBe('<sigml><hns_sign gloss="TEST_UNIQUE"/></sigml>');
    expect(second).toBe(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status: 404 });
    expect(await fetchAndCacheSiGML('missing_sign_xyz_999')).toBeNull();
  });

  it('dispatches same-origin postMessage via playSiGMLFast', async () => {
    const postMessage = vi.fn();
    const fakeIframe = { contentWindow: { postMessage } };
    const result = await playSiGMLFast(fakeIframe, 'SignFiles/hello.sigml', 1.5);
    expect(result).toBe(true);
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ file: 'SignFiles/hello.sigml', speed: 1.5 }),
      window.location.origin
    );
    expect(await playSiGMLFast(fakeIframe, 'https://evil.com/x.sigml')).toBe(false);
  });

  it('builds vocabulary and quiz lists without single-letter or pure-number entries in quiz pool', () => {
    const { allWords, lookupMap } = getAllVocabulary();
    expect(allWords.length).toBeGreaterThan(100);
    expect(lookupMap.has('hello')).toBe(true);

    const quizWords = getQuizVocabulary();
    expect(quizWords.length).toBeGreaterThan(50);
    expect(quizWords.every((w) => w.label.trim().length > 1 && !/^\d+$/.test(w.label.trim()))).toBe(true);
  });
});

describe('sentenceEngine', () => {
  function makeHand({ index = false, middle = false, ring = false, pinky = false, thumbOut = false, thumbUp = false, wristY = 0.7, spread = false } = {}) {
    const lms = Array.from({ length: 21 }, () => ({ x: 0.5, y: wristY, z: 0 }));
    lms[0] = { x: 0.5, y: wristY, z: 0 };
    lms[9] = { x: 0.5, y: wristY - 0.16, z: 0 };
    lms[5] = { x: 0.44, y: wristY - 0.15, z: 0 };
    lms[13] = { x: 0.56, y: wristY - 0.15, z: 0 };
    lms[17] = { x: 0.62, y: wristY - 0.12, z: 0 };

    // Thumb
    lms[2] = { x: 0.41, y: wristY - 0.08, z: 0 };
    lms[3] = { x: 0.38, y: wristY - 0.13, z: 0 };
    lms[4] = thumbUp
      ? { x: 0.40, y: wristY - 0.28, z: 0 }
      : thumbOut
        ? { x: 0.25, y: wristY - 0.14, z: 0 }
        : { x: 0.46, y: wristY - 0.11, z: 0 };

    const setFinger = (mcp, pip, tip, ext, xOffset = 0) => {
      const m = lms[mcp];
      if (ext) {
        lms[pip] = { x: m.x + xOffset * 0.5, y: m.y - 0.10, z: 0 };
        lms[tip] = { x: m.x + xOffset, y: m.y - 0.22, z: 0 };
      } else {
        lms[pip] = { x: m.x, y: m.y - 0.04, z: 0 };
        lms[tip] = { x: m.x, y: m.y + 0.02, z: 0 };
      }
    };

    setFinger(5, 6, 8, index, spread ? -0.05 : 0);
    setFinger(9, 10, 12, middle, spread ? 0.02 : 0);
    setFinger(13, 14, 16, ring, spread ? 0.06 : 0);
    setFinger(17, 18, 20, pinky, spread ? 0.1 : 0);
    return lms;
  }

  it('normalizes landmarks relative to wrist and handles invalid input', () => {
    expect(normalizeLandmarks(null)).toBeNull();
    expect(normalizeLandmarks([{ x: 0, y: 0 }])).toBeNull();
    const norm = normalizeLandmarks(makeHand());
    expect(norm).toHaveLength(21);
    expect(norm[0]).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('detects single-hand and two-hand ISL sentence tokens accurately', () => {
    const ily = makeHand({ index: true, pinky: true, thumbOut: true });
    expect(detectSentenceComponent(ily).token).toBe('I_LOVE_YOU');

    const lHand = makeHand({ index: true, thumbOut: true });
    expect(detectSentenceComponent(lHand).token).toBe('SITE');

    const vHand = makeHand({ index: true, middle: true, spread: true });
    expect(detectSentenceComponent(vHand).token).toBe('VISIT');

    const open1 = makeHand({ index: true, middle: true, ring: true, pinky: true, thumbOut: true, wristY: 0.55, spread: true });
    const open2 = makeHand({ index: true, middle: true, ring: true, pinky: true, thumbOut: true, wristY: 0.55, spread: true });
    expect(detectSentenceComponent(open1, '', open2).token).toBe('HAPPY');
  });

  it('matches detected tokens to target sentence steps', () => {
    const siteStep = TARGET_SENTENCES[2].tokens[2];
    expect(checkTokenMatchesStep('SITE', siteStep)).toBe(true);
    expect(checkTokenMatchesStep('l_hand', siteStep)).toBe(true);
    expect(checkTokenMatchesStep('HAPPY', siteStep)).toBe(false);
    expect(checkTokenMatchesStep(null, siteStep)).toBe(false);
  });
});

describe('subscriptionManager & streakManager', () => {
  it('initializes free trial, deducts credits, and handles annual/monthly upgrades', () => {
    const initial = getSubscriptionStatus();
    expect(initial.isTrialActive).toBe(true);
    expect(initial.credits).toBe(50);

    const deducted = deductCredits(5);
    expect(deducted.success).toBe(true);
    expect(deducted.remainingCredits).toBe(45);

    const tooMuch = deductCredits(100);
    expect(tooMuch.success).toBe(false);
    expect(tooMuch.requireUpgrade).toBe(true);

    addCredits(10);
    expect(getSubscriptionStatus().credits).toBe(55);

    const annual = upgradeSubscription('annual');
    expect(annual.isPaidPlan).toBe(true);
    expect(annual.plan).toContain('Annual');
    expect(isProUnlocked()).toBe(true);

    const reset = resetFreeTrial();
    expect(reset.isTrialActive).toBe(true);
    expect(reset.credits).toBe(50);
    expect(isProUnlocked()).toBe(false);

    unlockProCourseSubscription('Pro Tier (₹199/mo)');
    expect(isProUnlocked()).toBe(true);
  });

  it('tracks consecutive day streaks and resets after missed days', () => {
    expect(updateStreak()).toBe(1);
    expect(getStreak()).toBe(1);

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    localStorage.setItem('lastStreakDate', yesterday);
    localStorage.setItem('userStreak', '4');
    expect(updateStreak()).toBe(5);

    const oldDate = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
    localStorage.setItem('lastStreakDate', oldDate);
    expect(updateStreak()).toBe(1);
  });
});

