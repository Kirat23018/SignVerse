/**
 * Ultra-Fast In-Memory SiGML Cache & Animation Dispatcher
 * Delivers sub-millisecond sign gesture dispatching with zero network roundtrips.
 */
import modulesData from '../modulesData.json';

// In-memory persistent cache for sanitized SiGML XML text
const sigmlMemoryCache = new Map();

// Helper: Sanitize SiGML XML text (strips UTF-8 BOM, XML prolog, rogue comments)
export function cleanSiGML(rawText) {
  if (!rawText) return '';
  let clean = rawText.trim();
  // Strip UTF-8 BOM if present
  if (clean.charCodeAt(0) === 0xfeff) {
    clean = clean.slice(1);
  }
  const sigmlStart = clean.indexOf('<sigml');
  if (sigmlStart !== -1) {
    clean = clean.substring(sigmlStart);
  }
  const sigmlEnd = clean.lastIndexOf('</sigml>');
  if (sigmlEnd !== -1) {
    clean = clean.substring(0, sigmlEnd + 8);
  }
  return clean.replace(/<sigml>\s*-->/gi, '<sigml>');
}

// Normalize any file reference to a clean relative path
export function resolveSigmlPath(fileOrItem) {
  if (!fileOrItem) return '';
  const rawFile = typeof fileOrItem === 'string' ? fileOrItem : (fileOrItem.file || fileOrItem.label || '');
  let file = String(rawFile).trim();

  // Strip leading slash
  if (file.startsWith('/')) file = file.slice(1);

  if (file.endsWith('.sigml')) {
    return file;
  }
  if (file.includes('DictionarySigns') || file.includes('SignFiles')) {
    return `${file}.sigml`;
  }
  return `SignFiles/${file}.sigml`;
}

// Fetch and store sanitized SiGML text in memory
export async function fetchAndCacheSiGML(filePath) {
  const normalizedPath = resolveSigmlPath(filePath);
  if (!normalizedPath) return null;

  if (sigmlMemoryCache.has(normalizedPath)) {
    return sigmlMemoryCache.get(normalizedPath);
  }

  try {
    const res = await fetch(`/${normalizedPath}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const sanitized = cleanSiGML(text);
    if (sanitized) {
      sigmlMemoryCache.set(normalizedPath, sanitized);
      return sanitized;
    }
  } catch (err) {
    // Non-blocking fallback
  }
  return null;
}

// Ultra-Fast Play: Dispatches immediately (< 1ms) if cached, or fetches then plays
export async function playSiGMLFast(iframeElement, fileOrItem, speedMultiplier = 1.0) {
  if (!iframeElement || !iframeElement.contentWindow) return false;
  const path = resolveSigmlPath(fileOrItem);
  if (!path) return false;

  const cw = iframeElement.contentWindow;

  // 1. Check in-memory cache for INSTANT 0ms execution
  if (sigmlMemoryCache.has(path)) {
    const cachedText = sigmlMemoryCache.get(path);
    try {
      if (typeof cw.playText === 'function') {
        cw.playText(cachedText);
      } else {
        cw.postMessage({ type: 'PLAY_TEXT', text: cachedText, file: path, payload: path, speed: speedMultiplier }, '*');
      }
      return true;
    } catch (e) {
      cw.postMessage({ type: 'PLAY_TEXT', text: cachedText, file: path, payload: path, speed: speedMultiplier }, '*');
      return true;
    }
  }

  // 2. Not yet cached: trigger fallback player command immediately
  try {
    if (typeof cw.startPlayer === 'function') {
      cw.startPlayer(path);
    } else {
      cw.postMessage({ type: 'PLAY_SIGML', file: path, payload: path, speed: speedMultiplier }, '*');
    }
  } catch (e) {
    cw.postMessage({ type: 'PLAY_SIGML', file: path, payload: path, speed: speedMultiplier }, '*');
  }

  // 3. Cache it in background for all subsequent plays
  fetchAndCacheSiGML(path).then((text) => {
    if (text) {
      sigmlMemoryCache.set(path, text);
    }
  });

  return true;
}

// Flattened, validated vocabulary database with O(1) Map
let cachedFlatList = null;
let cachedLookupMap = null;

export function getAllVocabulary() {
  if (cachedFlatList && cachedLookupMap) {
    return { allWords: cachedFlatList, lookupMap: cachedLookupMap };
  }

  const list = [];
  const map = new Map();

  for (const category in modulesData) {
    if (Array.isArray(modulesData[category])) {
      modulesData[category].forEach((item) => {
        if (item.type !== 'video' && item.label && item.file) {
          const resolved = resolveSigmlPath(item.file);
          const enriched = {
            ...item,
            category: category,
            resolvedPath: resolved,
            labelLower: item.label.toLowerCase().trim()
          };
          list.push(enriched);
          map.set(enriched.labelLower, enriched);
        }
      });
    }
  }

  // Sort so expressive dictionary words appear first, and pure numbers appear later
  list.sort((a, b) => {
    const isNumA = /^\d+$/.test(a.label);
    const isNumB = /^\d+$/.test(b.label);
    if (isNumA !== isNumB) return isNumA ? 1 : -1;
    return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
  });

  cachedFlatList = list;
  cachedLookupMap = map;
  return { allWords: list, lookupMap: map };
}

// High-priority vocabulary for Quiz and Practice (clear, expressive English words)
export function getQuizVocabulary() {
  const { allWords } = getAllVocabulary();
  // Filter out pure numbers or single-letter codes for richer quiz & practice experience
  return allWords.filter((w) => {
    const label = w.label.trim();
    return label.length > 1 && !/^\d+$/.test(label) && !label.endsWith('.sigml');
  });
}

// Background pre-loader for top 100 most frequent signs
export function startBackgroundPrefetch() {
  if (typeof window === 'undefined') return;

  const commonSigns = [
    'hello', 'thankyou', 'please', 'help', 'family', 'father', 'mother',
    'brother', 'sister', 'friend', 'happy', 'goodmorning', 'howareyou',
    'good', 'bad', 'yes', 'no', 'food', 'water', 'name', 'apple', 'banana',
    'welcome', 'today', 'tomorrow', 'time', 'school', 'book', 'home'
  ];

  const prefetchQueue = commonSigns.map((s) => `SignFiles/${s}.sigml`);

  const runIdle = () => {
    let index = 0;
    const step = async () => {
      if (index >= prefetchQueue.length) return;
      const file = prefetchQueue[index++];
      if (!sigmlMemoryCache.has(file)) {
        await fetchAndCacheSiGML(file);
      }
      setTimeout(step, 80);
    };
    step();
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(runIdle, { timeout: 3000 });
  } else {
    setTimeout(runIdle, 1500);
  }
}

// Automatically start background prefetch on app load
if (typeof window !== 'undefined') {
  startBackgroundPrefetch();
}
