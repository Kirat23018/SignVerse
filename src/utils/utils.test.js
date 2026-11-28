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
  preloadSiGMLBatch,
  getSigmlCacheStats,
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
import { createFrameDispatcher, cleanupCameraResources } from './mediapipeLoader';
import {
  buildIslGlossSequence,
  translateEnglishToISL,
  ISL_LINGUISTIC_DISCLAIMER
} from './islTranslator';

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

  it('deduplicates concurrent in-flight SiGML fetches and preloads batches', async () => {
    const beforeStats = getSigmlCacheStats();
    let resolveFetch;
    const pendingResponse = new Promise((res) => {
      resolveFetch = res;
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockReturnValue(pendingResponse);

    const p1 = fetchAndCacheSiGML('concurrent_dedup_sign_901');
    const p2 = fetchAndCacheSiGML('concurrent_dedup_sign_901');
    const p3 = fetchAndCacheSiGML('concurrent_dedup_sign_901');

    resolveFetch({
      ok: true,
      text: async () => '<sigml><hns_sign gloss="DEDUP"/></sigml>'
    });

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    expect(r1).toBe('<sigml><hns_sign gloss="DEDUP"/></sigml>');
    expect(r2).toBe(r1);
    expect(r3).toBe(r1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '<sigml><hns_sign gloss="BATCH"/></sigml>'
    });
    await preloadSiGMLBatch([
      'SignFiles/batch_one_902.sigml',
      'SignFiles/batch_two_903.sigml',
      'SignFiles/batch_one_902.sigml'
    ]);
    const afterStats = getSigmlCacheStats();
    expect(afterStats.cachedCount).toBeGreaterThanOrEqual(beforeStats.cachedCount + 3);
    expect(afterStats.inFlightCount).toBe(0);
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

describe('islTranslator (English-to-ISL Linguistic Approximation)', () => {
  it('omits English copulas/articles, places time markers first, and keeps WH-words/negation clause-final', () => {
    const seq1 = buildIslGlossSequence('I am going to the market today');
    expect(seq1.map((t) => t.gloss)).toEqual(['TODAY', 'I', 'MARKET', 'GOING']);

    const seq2 = buildIslGlossSequence('What is your name?');
    expect(seq2.map((t) => t.gloss)).toEqual(['NAME WHAT']);

    const seqWh = buildIslGlossSequence('Where are you going?');
    expect(seqWh.map((t) => t.gloss)).toEqual(['YOU', 'GOING', 'WHERE']);

    const seq3 = buildIslGlossSequence('I do not like tea');
    expect(seq3.map((t) => t.gloss)).toEqual(['I', 'TEA', 'LIKE', 'NOT']);
  });

  it('resolves multi-word phrases, synonyms, and fingerspelling fallback with disclaimer', () => {
    const { lookupMap } = getAllVocabulary();
    const result = translateEnglishToISL('Hi thank you zq', lookupMap);

    expect(result.disclaimer).toBe(ISL_LINGUISTIC_DISCLAIMER);
    expect(result.stats.totalTokens).toBeGreaterThanOrEqual(3);
    expect(result.steps.some((s) => s.matchType === 'synonym')).toBe(true);
    expect(result.steps.some((s) => s.matchType === 'fingerspell')).toBe(true);
    expect(result.steps.every((s) => typeof s.file === 'string' && s.file.endsWith('.sigml'))).toBe(true);
  });
});

describe('mediapipeLoader (Camera Frame Pacer & Resource Cleanup)', () => {
  it('enforces backpressure, pauses when requested, and skips duplicate video frames', async () => {
    const dispatcher = createFrameDispatcher({ minIntervalMs: 33 });
    let resolveFirst;
    const send = vi.fn().mockImplementationOnce(
      () => new Promise((res) => {
        resolveFirst = res;
      })
    );
    const hands = { send };
    const video = { readyState: 2, paused: false, ended: false, currentTime: 0.1 };

    // Paused tab skips inference
    expect(await dispatcher.dispatch(video, hands, { isPaused: true })).toBe(false);
    expect(send).not.toHaveBeenCalled();

    // First valid frame starts processing; overlapping call drops cleanly due to backpressure
    const firstPromise = dispatcher.dispatch(video, hands);
    video.currentTime = 0.2;
    expect(await dispatcher.dispatch(video, hands)).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);

    resolveFirst();
    expect(await firstPromise).toBe(true);
    expect(dispatcher.getMetrics().totalProcessed).toBe(1);
  });

  it('stops camera, closes hands, and releases all MediaStream tracks cleanly', () => {
    const camera = { stop: vi.fn() };
    const hands = { close: vi.fn() };
    const track1 = { stop: vi.fn() };
    const track2 = { stop: vi.fn() };
    const video = { srcObject: { getTracks: () => [track1, track2] } };
    const clearRect = vi.fn();
    const canvas = { width: 640, height: 480, getContext: () => ({ clearRect }) };

    cleanupCameraResources({ camera, hands, video, canvas });
    expect(camera.stop).toHaveBeenCalledTimes(1);
    expect(hands.close).toHaveBeenCalledTimes(1);
    expect(track1.stop).toHaveBeenCalledTimes(1);
    expect(track2.stop).toHaveBeenCalledTimes(1);
    expect(clearRect).toHaveBeenCalledWith(0, 0, 640, 480);
  });
});

