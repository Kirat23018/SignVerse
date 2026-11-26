/**
 * SignVerse Secure Serverless AI Chat Proxy (Vercel Function)
 * Keeps GROQ_API_KEY and GEMINI_API_KEY strictly server-side so secrets
 * are never bundled into frontend assets.
 */

export const SYSTEM_PROMPT = `You are SignBot, an expert, friendly, and ultra-intelligent AI Assistant embedded in the SignVerse 3D Sign Language Learning and Translation platform.

You can answer ANY question in real-time across all subjects:
- General Knowledge, Science, Technology, Coding, Mathematics, History, Famous People, and Daily Conversations.
- Conversational chat (Greetings, how are you, identity, jokes, motivation).
- Sign Language & Deaf Culture (ASL, ISL, BSL, gestures, fingerspelling, grammar, facial expressions).
- SignVerse Platform Details (3D Avatars: Luna, Marc, Anna, Francoise, Siggi; SiGML XML notation based on HamNoSys; JASign/CWASA WebGL engine; AI Text & Voice to Sign Translate; Flashcard Practice; Timed Quizzes; Daily Streak and ranking badges).

Formatting Rules:
- Keep answers concise, clear, and well-structured with Markdown bullet points and bolding.
- If the user asks about a feature in SignVerse (e.g. translation, alphabets, quiz, flashcards, dashboard), mention the feature and add an action route at the end in the format: [[ACTION:Label|Route]] (e.g. [[ACTION:Go to Translator|/translate]], [[ACTION:Start a Quiz|/quiz]], [[ACTION:Learn Alphabets|/alphabets]], [[ACTION:View Dashboard|/dashboard]]).
- Be polite, supportive, and accessibility-conscious.`;

const ALLOWED_ROUTE_REGEX = /^\/[a-zA-Z0-9\-_/?=&%]*$/;
const MAX_QUERY_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 10;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimitStore = new Map();

export function resetRateLimiter() {
  rateLimitStore.clear();
}

export function getClientIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req?.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req?.socket?.remoteAddress || 'unknown';
}

export function checkRateLimit(ip, now = Date.now()) {
  const key = ip || 'unknown';
  const timestamps = (rateLimitStore.get(key) || []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldest = timestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000));
    rateLimitStore.set(key, timestamps);
    return { allowed: false, remaining: 0, retryAfterSec };
  }
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - timestamps.length),
    retryAfterSec: 0
  };
}

export function isSafeInternalRoute(route) {
  if (typeof route !== 'string') return false;
  const trimmed = route.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return false;
  return ALLOWED_ROUTE_REGEX.test(trimmed);
}

export function parseActionFromResponse(rawText, providerTag) {
  let cleanedText = String(rawText || '');
  let action = null;
  const actionMatch = cleanedText.match(/\[\[ACTION:(.*?)\|(.*?)\]\]/);
  if (actionMatch) {
    const label = actionMatch[1].trim().slice(0, 80);
    const route = actionMatch[2].trim();
    if (label && isSafeInternalRoute(route)) {
      action = { label, route };
    }
    cleanedText = cleanedText.replace(/\[\[ACTION:.*?\|.*?\]\]/, '').trim();
  }

  return {
    text: cleanedText,
    action,
    isRealtimeAI: true,
    provider: providerTag
  };
}

export function validateChatPayload(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request payload.' };
  }

  const rawQuery = typeof body.query === 'string' ? body.query.trim() : '';
  if (!rawQuery) {
    return { valid: false, error: 'Query must be a non-empty string.' };
  }
  if (rawQuery.length > MAX_QUERY_LENGTH) {
    return { valid: false, error: `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters.` };
  }

  const rawHistory = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_ITEMS) : [];
  const sanitizedHistory = rawHistory
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const role = item.sender === 'user' || item.role === 'user' ? 'user' : 'assistant';
      const rawText =
        typeof item.text === 'string'
          ? item.text
          : typeof item.parts?.[0]?.text === 'string'
            ? item.parts[0].text
            : '';
      const text = rawText.trim().slice(0, MAX_QUERY_LENGTH);
      if (!text) return null;
      return { role, text };
    })
    .filter(Boolean);

  return {
    valid: true,
    query: rawQuery,
    history: sanitizedHistory
  };
}

async function queryGroq(query, history, apiKey) {
  const modelsToTry = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'gemma2-9b-it'
  ];

  for (const model of modelsToTry) {
    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-6).map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        { role: 'user', content: query }
      ];

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 800
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) continue;

      const data = await response.json();
      let rawText = data?.choices?.[0]?.message?.content || '';
      rawText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      if (rawText) {
        return parseActionFromResponse(rawText, 'Groq AI ⚡');
      }
    } catch {
      // Try next fallback model without exposing internal details
    }
  }

  return null;
}

async function queryGemini(query, history, apiKey) {
  try {
    const contents = [
      ...history.slice(-8).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })),
      {
        role: 'user',
        parts: [{ text: query }]
      }
    ];

    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) return null;

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) return null;

    return parseActionFromResponse(rawText, 'Gemini 1.5 Flash ⚡');
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const rate = checkRateLimit(getClientIp(req));
  res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfterSec));
    return res.status(429).json({
      error: `Too many requests. Please wait ${rate.retryAfterSec}s before trying again.`,
      retryAfterSec: rate.retryAfterSec
    });
  }

  const parsed = validateChatPayload(req.body);
  if (!parsed.valid) {
    return res.status(400).json({ error: parsed.error });
  }

  const customHeader = req.headers?.['x-custom-api-key'];
  const customKey = typeof customHeader === 'string' ? customHeader.trim() : '';
  const serverGroqKey = (process.env.GROQ_API_KEY || '').trim();
  const serverGeminiKey = (process.env.GEMINI_API_KEY || '').trim();

  const apiKey = customKey || serverGroqKey || serverGeminiKey;

  if (!apiKey) {
    return res.status(200).json({ fallback: true, isRealtimeAI: false });
  }

  const result = apiKey.startsWith('gsk_')
    ? await queryGroq(parsed.query, parsed.history, apiKey)
    : await queryGemini(parsed.query, parsed.history, apiKey);

  if (!result) {
    return res.status(200).json({ fallback: true, isRealtimeAI: false });
  }

  return res.status(200).json(result);
}

