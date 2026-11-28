/**
 * Lightweight Runtime SiGML Cache & Animation Dispatcher
 * Intentionally excludes modulesData.json (275 KB) so root App / AvatarStageProvider
 * stays ultra-lean while sharing one unified in-memory & iframe cache.
 */

const sigmlMemoryCache = new Map();
const inFlightFetches = new Map();

const cacheStats = {
  hits: 0,
  misses: 0
};

let backgroundPrefetchStarted = false;

export function getSigmlCacheStats() {
  return {
    cachedCount: sigmlMemoryCache.size,
    inFlightCount: inFlightFetches.size,
    hits: cacheStats.hits,
    misses: cacheStats.misses
  };
}

export function cleanSiGML(rawText) {
  if (!rawText) return '';
  let clean = rawText.trim();
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

export function resolveSigmlPath(fileOrItem) {
  if (!fileOrItem) return '';
  const rawFile = typeof fileOrItem === 'string' ? fileOrItem : (fileOrItem.file || fileOrItem.label || '');
  let file = String(rawFile).trim();
  if (!file) return '';

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

export function cacheSiGMLText(filePath, rawText) {
  const normalizedPath = resolveSigmlPath(filePath);
  if (!normalizedPath || !rawText) return '';
  const sanitized = cleanSiGML(rawText);
  if (sanitized) {
    sigmlMemoryCache.set(normalizedPath, sanitized);
  }
  return sanitized;
}

export async function fetchAndCacheSiGML(filePath) {
  const normalizedPath = resolveSigmlPath(filePath);
  if (!normalizedPath) return null;

  if (sigmlMemoryCache.has(normalizedPath)) {
    return sigmlMemoryCache.get(normalizedPath);
  }

  if (inFlightFetches.has(normalizedPath)) {
    return inFlightFetches.get(normalizedPath);
  }

  const fetchPromise = (async () => {
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
    } finally {
      inFlightFetches.delete(normalizedPath);
    }
    return null;
  })();

  inFlightFetches.set(normalizedPath, fetchPromise);
  return fetchPromise;
}

export async function preloadSiGMLBatch(paths = [], concurrency = 3) {
  const seen = new Set();
  const queue = [];
  for (const raw of paths) {
    const p = resolveSigmlPath(raw);
    if (p && !seen.has(p) && !sigmlMemoryCache.has(p)) {
      seen.add(p);
      queue.push(p);
    }
  }

  if (queue.length === 0) return;

  let cursor = 0;
  const worker = async () => {
    while (cursor < queue.length) {
      const idx = cursor;
      cursor += 1;
      await fetchAndCacheSiGML(queue[idx]);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
  await Promise.all(workers);
}

export async function playSiGMLFast(iframeElement, fileOrItem, speedMultiplier = 1.0) {
  if (!iframeElement || !iframeElement.contentWindow) return false;
  const path = resolveSigmlPath(fileOrItem);
  if (!path) return false;

  const cw = iframeElement.contentWindow;
  const targetOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '*';

  if (sigmlMemoryCache.has(path)) {
    cacheStats.hits += 1;
    const cachedText = sigmlMemoryCache.get(path);
    try {
      if (typeof cw.playText === 'function') {
        cw.playText(cachedText, speedMultiplier);
      } else {
        cw.postMessage({ type: 'PLAY_TEXT', text: cachedText, file: path, payload: path, speed: speedMultiplier }, targetOrigin);
      }
      return true;
    } catch {
      cw.postMessage({ type: 'PLAY_TEXT', text: cachedText, file: path, payload: path, speed: speedMultiplier }, targetOrigin);
      return true;
    }
  }

  cacheStats.misses += 1;
  try {
    if (typeof cw.startPlayer === 'function') {
      cw.startPlayer(path, speedMultiplier);
    } else {
      cw.postMessage({ type: 'PLAY_SIGML', file: path, payload: path, speed: speedMultiplier }, targetOrigin);
    }
  } catch {
    cw.postMessage({ type: 'PLAY_SIGML', file: path, payload: path, speed: speedMultiplier }, targetOrigin);
  }

  // Warm in-memory cache in background so repeat plays use 0ms playText
  fetchAndCacheSiGML(path).catch(() => {});

  return true;
}

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

export function startBackgroundPrefetch() {
  if (typeof window === 'undefined' || backgroundPrefetchStarted) return;
  backgroundPrefetchStarted = true;

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
    preloadSiGMLBatch(prefetchQueue, 3).catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(runIdle, { timeout: 2500 });
  } else {
    setTimeout(runIdle, 1200);
  }
}
