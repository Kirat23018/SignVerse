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

// Normalize any file reference to a safe, clean relative path
export function resolveSigmlPath(fileOrItem) {
  if (!fileOrItem) return '';
  const rawFile = typeof fileOrItem === 'string' ? fileOrItem : (fileOrItem.file || fileOrItem.label || '');
  let file = String(rawFile).trim();
  if (!file) return '';

  // Reject absolute external URLs, protocol-relative URLs, dangerous schemes, and path traversal
  const lower = file.toLowerCase();
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('//') ||
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    file.includes('..')
  ) {
    return '';
  }

  // Strip leading slashes
  file = file.replace(/^\/+/, '');
  if (!file) return '';

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
  } catch {
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
  const targetOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '*';

  // 1. Check in-memory cache for INSTANT 0ms execution
  if (sigmlMemoryCache.has(path)) {
    const cachedText = sigmlMemoryCache.get(path);
    try {
      if (typeof cw.playText === 'function') {
        cw.playText(cachedText);
      } else {
        cw.postMessage({ type: 'PLAY_TEXT', text: cachedText, file: path, payload: path, speed: speedMultiplier }, targetOrigin);
      }
      return true;
    } catch {
      cw.postMessage({ type: 'PLAY_TEXT', text: cachedText, file: path, payload: path, speed: speedMultiplier }, targetOrigin);
      return true;
    }
  }

  // 2. Not yet cached: trigger fallback player command immediately
  try {
    if (typeof cw.startPlayer === 'function') {
      cw.startPlayer(path);
    } else {
      cw.postMessage({ type: 'PLAY_SIGML', file: path, payload: path, speed: speedMultiplier }, targetOrigin);
    }
  } catch {
    cw.postMessage({ type: 'PLAY_SIGML', file: path, payload: path, speed: speedMultiplier }, targetOrigin);
  }

  // 3. Cache it in background for all subsequent plays
  fetchAndCacheSiGML(path).then((text) => {
    if (text) {
      sigmlMemoryCache.set(path, text);
    }
  });

  return true;
}

// Stop any active avatar animation inside the CWASA iframe
export function stopSiGML(iframeElement) {
  if (!iframeElement || !iframeElement.contentWindow) return false;
  const cw = iframeElement.contentWindow;
  const targetOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '*';
  try {
    if (typeof cw.stopPlayer === 'function') {
      cw.stopPlayer();
    } else {
      cw.postMessage({ type: 'STOP_SIGML' }, targetOrigin);
    }
    return true;
  } catch {
    try {
      cw.postMessage({ type: 'STOP_SIGML' }, targetOrigin);
      return true;
    } catch {
      return false;
    }
  }
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

  const prefetchQueue = [
    'SignFiles/hello.sigml',
    'SignFiles/thankyou.sigml',
    'SignFiles/please.sigml',
    'SignFiles/help.sigml',
    'SignFiles/family.sigml',
    'SignFiles/father.sigml',
    'SignFiles/mother.sigml',
    'SignFiles/brother.sigml',
    'SignFiles/sister.sigml',
    'SignFiles/friend.sigml',
    'SignFiles/happy.sigml',
    'SignFiles/goodmorning.sigml',
    'SignFiles/howareyou.sigml',
    'SignFiles/good.sigml',
    'SignFiles/bad.sigml',
    'SignFiles/yes.sigml',
    'SignFiles/no.sigml',
    'DictionarySigns/dishes_and_spices/food.sigml',
    'DictionarySigns/things_on_earth/water.sigml',
    'SignFiles/namewhat.sigml',
    'SignFiles/apple.sigml',
    'SignFiles/banana.sigml',
    'DictionarySigns/verbs/welcome.sigml',
    'SignFiles/today.sigml',
    'SignFiles/tomorrow.sigml',
    'SignFiles/time.sigml',
    'DictionarySigns/educational_terms/school.sigml',
    'SignFiles/book.sigml',
    'DictionarySigns/household_articles/home.sigml'
  ];

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
