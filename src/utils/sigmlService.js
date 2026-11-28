/**
 * Full SiGML Dictionary + Vocabulary Lookup Service
 * Re-exports lightweight sigmlRuntime helpers alongside the 275 KB modulesData vocabulary
 * so non-dictionary routes and root App bundle do not eagerly pull modulesData.json.
 */
import modulesData from '../modulesData.json';
import { resolveSigmlPath, startBackgroundPrefetch } from './sigmlRuntime';

export {
  cleanSiGML,
  resolveSigmlPath,
  cacheSiGMLText,
  fetchAndCacheSiGML,
  preloadSiGMLBatch,
  playSiGMLFast,
  stopSiGML,
  getSigmlCacheStats,
  startBackgroundPrefetch
} from './sigmlRuntime';

if (typeof window !== 'undefined') {
  startBackgroundPrefetch();
}

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
            category,
            resolvedPath: resolved,
            labelLower: item.label.toLowerCase().trim()
          };
          list.push(enriched);
          map.set(enriched.labelLower, enriched);
        }
      });
    }
  }

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

export function getQuizVocabulary() {
  const { allWords } = getAllVocabulary();
  return allWords.filter((w) => {
    const label = w.label.trim();
    return label.length > 1 && !/^\d+$/.test(label) && !label.endsWith('.sigml');
  });
}
