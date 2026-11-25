import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler, {
  isSafeInternalRoute,
  parseActionFromResponse,
  validateChatPayload
} from './chat.js';

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

describe('api/chat serverless proxy', () => {
  beforeEach(() => {
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  it('allows valid internal routes and blocks open-redirect / dangerous protocols', () => {
    expect(isSafeInternalRoute('/translate')).toBe(true);
    expect(isSafeInternalRoute('/courses/text-to-sign/tts-mod-1/lesson-1')).toBe(true);
    expect(isSafeInternalRoute('//evil.com')).toBe(false);
    expect(isSafeInternalRoute('https://evil.com')).toBe(false);
    expect(isSafeInternalRoute('javascript:alert(1)')).toBe(false);
    expect(isSafeInternalRoute('translate')).toBe(false);
  });

  it('strips unsafe action routes from LLM responses while keeping safe ones', () => {
    const safe = parseActionFromResponse('Try this! [[ACTION:Open Quiz|/quiz]]', 'Groq AI ⚡');
    expect(safe.text).toBe('Try this!');
    expect(safe.action).toEqual({ label: 'Open Quiz', route: '/quiz' });

    const unsafe = parseActionFromResponse('Click [[ACTION:Hack|https://evil.com]]', 'Groq AI ⚡');
    expect(unsafe.text).toBe('Click');
    expect(unsafe.action).toBeNull();
  });

  it('validates chat payload structure and length limits', () => {
    expect(validateChatPayload(null).valid).toBe(false);
    expect(validateChatPayload({ query: '   ' }).valid).toBe(false);
    expect(validateChatPayload({ query: 'a'.repeat(2001) }).valid).toBe(false);

    const ok = validateChatPayload({
      query: '  What is ISL? ',
      history: [{ sender: 'user', text: 'Hi' }, { bad: true }]
    });
    expect(ok.valid).toBe(true);
    expect(ok.query).toBe('What is ISL?');
    expect(ok.history).toEqual([{ role: 'user', text: 'Hi' }]);
  });

  it('rejects non-POST methods with 405 and invalid body with 400', async () => {
    const getRes = createMockRes();
    await handler({ method: 'GET' }, getRes);
    expect(getRes.statusCode).toBe(405);

    const badRes = createMockRes();
    await handler({ method: 'POST', body: { query: '' } }, badRes);
    expect(badRes.statusCode).toBe(400);
  });

  it('returns fallback signal when no server or custom API key is configured', async () => {
    const res = createMockRes();
    await handler({ method: 'POST', body: { query: 'Hello' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ fallback: true, isRealtimeAI: false });
  });

  it('proxies Groq server key securely and strips <think> blocks', async () => {
    process.env.GROQ_API_KEY = ['gsk', 'dummy_unit_key'].join('_');
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '<think>hidden</think>Hello! [[ACTION:Translate|/translate]]' } }]
      })
    });

    const res = createMockRes();
    await handler({ method: 'POST', body: { query: 'Hello' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      text: 'Hello!',
      action: { label: 'Translate', route: '/translate' },
      isRealtimeAI: true,
      provider: 'Groq AI ⚡'
    });
  });

  it('never leaks keys or errors when upstream fails', async () => {
    const dummyGeminiKey = 'dummy_gemini_unit_key';
    process.env.GEMINI_API_KEY = dummyGeminiKey;
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error(`network boom ${dummyGeminiKey}`));

    const res = createMockRes();
    await handler({ method: 'POST', body: { query: 'Hello' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ fallback: true, isRealtimeAI: false });
    expect(JSON.stringify(res.body)).not.toContain(dummyGeminiKey);
  });
});

