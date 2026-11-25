/**
 * Real-Time AI Chatbot Intelligence Engine for SignVerse
 * Routes requests through the secure /api/chat server proxy (keeping API keys off the client)
 * with resilient local knowledge base fallback.
 */

export const QUICK_SUGGESTIONS = [
  "How are you?",
  "Who is Albert Einstein?",
  "What is SignVerse?",
  "How to translate voice to 3D sign?",
  "Is Sign Language universal?",
  "Tell me a fun fact about Sign Language"
];

const ALLOWED_ROUTE_REGEX = /^\/[a-zA-Z0-9\-_/?=&%]*$/;
const MAX_QUERY_LENGTH = 2000;

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

/**
 * Ask AI via secure /api/chat serverless proxy with graceful local fallback.
 * Never embeds or reads VITE_ API keys in frontend code.
 */
export async function askGeminiRealtime(userQuery, conversationHistory = [], customApiKey = null) {
  const cleanQuery = typeof userQuery === 'string' ? userQuery.trim().slice(0, MAX_QUERY_LENGTH) : '';
  if (!cleanQuery) {
    return {
      text: "Please enter a question so I can help you!",
      action: null,
      isRealtimeAI: false
    };
  }

  const normalizedHistory = Array.isArray(conversationHistory)
    ? conversationHistory
        .slice(-8)
        .map((msg) => {
          const text =
            typeof msg?.text === 'string'
              ? msg.text
              : typeof msg?.parts?.[0]?.text === 'string'
                ? msg.parts[0].text
                : '';
          const role = msg?.sender === 'user' || msg?.role === 'user' ? 'user' : 'model';
          return text.trim() ? { role, text: text.trim().slice(0, MAX_QUERY_LENGTH) } : null;
        })
        .filter(Boolean)
    : [];

  const sessionCustomKey =
    typeof window !== 'undefined' && window.sessionStorage
      ? window.sessionStorage.getItem('signverse_session_ai_key') || ''
      : '';
  const overrideKey = (customApiKey || sessionCustomKey || '').trim();

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (overrideKey) {
      headers['X-Custom-API-Key'] = overrideKey;
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 12000) : null;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: cleanQuery,
        history: normalizedHistory
      }),
      ...(controller ? { signal: controller.signal } : {})
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      return getLocalBotResponse(cleanQuery);
    }

    const data = await response.json();
    if (!data || data.fallback || !data.text) {
      return getLocalBotResponse(cleanQuery);
    }

    const safeAction =
      data.action && isSafeInternalRoute(data.action.route)
        ? { label: String(data.action.label || 'Open').slice(0, 80), route: data.action.route }
        : null;

    return {
      text: String(data.text),
      action: safeAction,
      isRealtimeAI: Boolean(data.isRealtimeAI),
      provider: data.provider || 'SignBot AI'
    };
  } catch {
    return getLocalBotResponse(cleanQuery);
  }
}

/**
 * Strict Local Knowledge Base Fallback
 */
const LOCAL_KNOWLEDGE_BASE = [
  {
    keywords: ["how are you", "how r u", "kaise ho", "kya haal hai"],
    response: `I'm doing great, thank you! 😊✨ Ready to help you with **SignVerse**, Sign Language, or any general question.\n\nWhat would you like to explore today? 🤟`,
    action: { label: "Try 3D Translator", route: "/translate" }
  },
  {
    keywords: ["who are you", "what is your name", "who made you", "who created you"],
    response: `I am **SignBot** 🤖, the official AI Assistant for **SignVerse**!\n\nI was created to help everyone learn sign language seamlessly, bridge communication gaps between the hearing and Deaf communities, and answer any question in real time.`
  },
  {
    keywords: ["what is signverse", "about signverse", "signverse kya hai", "intro to signverse"],
    response: `**SignVerse** is an interactive, real-time **3D Sign Language Learning & Translation Platform** designed to make communication accessible for the Deaf and Hard-of-Hearing community! 🤟\n\n### 🌟 Key Features:\n- ⚡ **Real-time 3D Avatar Animation** (CWASA / JASign WebGL engine)\n- 🎙️ **Voice & Text to Sign Translation**\n- 📚 **A–Z Alphabets, Words, Flashcards & Timed Quizzes**\n- 🔥 **Daily Learning Streak & Rank System**`,
    action: { label: "Try 3D Translator", route: "/translate" }
  },
  {
    keywords: ["how does 3d avatar work", "how avatars work", "jasign", "cwasa", "sigml", "3d engine"],
    response: `The 3D magic in **SignVerse** is powered by the **JASign / CWASA** WebGL engine developed by the *University of East Anglia (UEA)*! 🪄\n\nGestures are codified as mathematical SiGML XML notation (based on HamNoSys) and rendered in WebGL directly in your browser.`,
    action: { label: "Try 3D Translator", route: "/translate" }
  },
  {
    keywords: ["voice to sign", "speech to sign", "how to use voice", "voice translate"],
    response: `**Voice-to-Sign** allows you to speak naturally into your microphone and watch the 3D Avatar perform sign language in real time! 🎙️\n\nGo to the **Translate** page and click **🎙️ Speak (Voice to Sign)** to try it!`,
    action: { label: "Open Voice Translator", route: "/translate" }
  },
  {
    keywords: ["is sign language universal", "universal sign"],
    response: `**No, Sign Language is NOT universal!** 🌍 Different countries have their own unique sign languages (e.g. ASL in the US, ISL in India, BSL in the UK).`,
    action: { label: "Learn A-Z Alphabets", route: "/alphabets" }
  },
  {
    keywords: ["tell me a joke", "joke"],
    response: `**Why did the computer go to sign language class?**\n*Because it wanted to improve its "user-interface-to-hand" connection!* 💻🤟`
  },
  {
    keywords: ["streak", "daily streak", "streak update"],
    response: `Your **Daily Learning Streak** 🔥 increases by **+1 Day** when you log in on consecutive calendar days. Keep learning daily!`,
    action: { label: "View Dashboard", route: "/dashboard" }
  },
  {
    keywords: ["graph", "dashboard graph", "progress graph", "analytics", "progress chart"],
    response: `Your **Dashboard** includes interactive real-time **Progress Analytics Graphs**:
- 📈 **Accuracy Progression Curve**: SVG Area chart tracking your quiz scores.
- 📅 **7-Day Weekly Activity Bar Chart**: Shows daily signs practiced and streak milestones.
- 🎯 **Skill Mastery Breakdown**: Measures Fingerspelling, Vocabulary, Translation, and Recall speed.
- 🌟 **Rank Roadmap**: Visual pathway from Beginner 🌱 to Master 👑!`,
    action: { label: "View Progress Graphs", route: "/dashboard" }
  },
  {
    keywords: ["sign to text", "camera sign", "gesture recognition", "webcam sign"],
    response: `Explore our **3D Translation & Sign Dictionary** to look up words or convert sentences into real-time 3D sign language gestures! 🤟`,
    action: { label: "Explore Dictionary", route: "/words" }
  },
  {
    keywords: ["pricing", "price", "subscription", "free trial", "credits", "plans", "cost"],
    response: `**SignVerse Pricing & Plans:** 💎
- 🎁 **3-Day Free Trial**: 50 Free AI Credits + Full Core Access.
- 🚀 **Pro Monthly (₹199/mo)**: Unlimited 3D translations, 500 AI credits & all 5 avatars.
- 💰 **Pro Annual (₹1,499/yr)**: Save 38%, unlimited everything & certificate.`,
    action: { label: "View Pricing Plans", route: "/pricing" }
  },
  {
    keywords: ["who made this", "team", "creators", "dilpreet", "dilpreet singh", "hardeep", "prabhkirat"],
    response: `**Meet the SignVerse Engineering Team:** ✨
- 👨‍💻 **Hardeep Singh**: Lead Full-Stack & 3D Avatar Architect
- ⚡ **Dilpreet Singh**: AI, Computer Vision & Gesture Recognition Lead
- 👩‍💻 **Prabhkirat Kaur**: UI/UX Design Lead & Educational Curriculum Developer`,
    action: { label: "Go to Home", route: "/" }
  }
];

export function getLocalBotResponse(userQuery) {
  const query = String(userQuery || '').toLowerCase().trim();

  for (const entry of LOCAL_KNOWLEDGE_BASE) {
    for (const kw of entry.keywords) {
      if (query === kw || query.includes(kw)) {
        return {
          text: entry.response,
          action: entry.action || null,
          isRealtimeAI: false
        };
      }
    }
  }

  return {
    text: `I'm **SignBot**, your AI companion! 🌍\n\nAsk me about **Sign Language, 3D Avatars, Coding, Science, or General Knowledge** in real time!`,
    action: { label: "Try 3D Translator", route: "/translate" },
    isRealtimeAI: false
  };
}
