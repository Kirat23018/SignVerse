# SignVerse — Interactive 3D Sign Language & Vision Accessibility Platform

SignVerse is a web-based accessibility platform converting English text and speech into 3D Sign Language animations (SiGML / CWASA WebGL) alongside in-browser MediaPipe 21-landmark hand sign recognition and structured learning modules.

---

## Key Features

- **Text & Voice to ISL 3D Translator (`/translate`)**: Rule-based English-to-ISL gloss approximation (SOV/Topic-Comment reordering, clause-final WH/negation, synonym resolution, and fingerspelling fallback with explicit linguistic approximation disclosure), multi-avatar selector (`Luna`, `Marc`, `Anna`, `Francoise`, `Siggi`), adjustable speed (`0.8x`–`2.2x`), and immediate Stop control.
- **2,770-Sign 3D Vocabulary & A–Z Fingerspelling (`/words`, `/alphabets`)**: Instant client-side SiGML XML cache, double-handed (ISL) and single-handed alphabets, and keyboard navigation.
- **LiveCam Vision Studio (`/sign-to-text`)**: Real-time in-browser MediaPipe 21-landmark hand tracking for 5 static signs (`Yes`, `Stop`, `Victory`, `One`, `Rock`) and guided multi-step sentence sequencing (`src/utils/sentenceEngine.js`).
- **Dual-Track Academy, Flashcards & Timed Quizzes (`/courses`, `/practice`, `/quiz`)**: 15 Text-to-Sign and 15 LiveCam modules, self-paced flashcards, and timed quizzes.
- **Genuine Analytics Dashboard (`/dashboard`)**: Quiz accuracy trajectory, 7-day volume, XP progression, and milestone badges computed directly from recorded `localStorage` activity.
- **SignBot AI Proxy (`/api/chat`)**: Serverless Groq / Gemini proxy with rate limiting, input validation, safe route parsing, and local knowledge base fallback.

---

## Tech Stack

- **Frontend**: React 19, Vite 8, React Router DOM 7, Tailwind CSS 4, `react-webcam`
- **3D Rendering**: CWASA / JASign WebGL player (`public/player-applet.html`) + 2,770 `.sigml` assets in `public/`
- **Computer Vision**: Client-side MediaPipe Hands (21 landmarks)
- **Serverless API**: Vercel Node function (`api/chat.js`)
- **Quality & Testing**: `oxlint`, Vitest + React Testing Library (`npm test`), Python `unittest`

---

## Getting Started

```bash
npm install
npm run dev
```

Configure server-side AI keys in `.env` (never prefix secrets with `VITE_`):

```env
GROQ_API_KEY=...
GEMINI_API_KEY=...
```

Run checks and production build:

```bash
npm run lint
npm test
npm run build
```

---

## Author
- **Prabhkirat Kaur**
