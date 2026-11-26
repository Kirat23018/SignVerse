/**
 * Indian Sign Language (ISL) Linguistic Gloss Translator
 *
 * Converts English prose into an ISL-ordered gloss sequence using deterministic
 * linguistic rules (Topic-Comment / SOV ordering, time-first placement, omission
 * of English copulas/articles, clause-final WH-question and negation placement)
 * mapped against SignVerse's verified SiGML dictionary.
 *
 * Note: Automated glossing is a linguistic approximation and should be reviewed
 * by qualified ISL educators/interpreters for formal or critical communication.
 */

export const ISL_LINGUISTIC_DISCLAIMER =
  'Automated English-to-ISL gloss approximation using rule-based SOV ordering. Not a substitute for certified ISL interpretation.';

const ENGLISH_FUNCTION_WORDS_TO_DROP = new Set([
  'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'to', 'of', 'for', 'with', 'at', 'by', 'from', 'as', 'that'
]);

const TIME_MARKERS = new Set([
  'today', 'tomorrow', 'yesterday', 'now', 'morning', 'night', 'evening',
  'afternoon', 'week', 'month', 'year', 'time', 'monday', 'tuesday',
  'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'daily', 'always'
]);

const WH_WORDS = new Set([
  'what', 'where', 'when', 'who', 'why', 'which', 'how', 'whose', 'whom'
]);

const NEGATION_WORDS = new Set([
  'no', 'not', 'never', 'none', 'nothing', 'neither', 'nowhere', 'cant', 'cannot', 'dont'
]);

const PRONOUN_AND_GRAMMAR_ALIASES = {
  "i'm": ['i'],
  "i've": ['i'],
  "i'll": ['future', 'i'],
  "you're": ['you'],
  "we're": ['we'],
  "they're": ['they'],
  "don't": ['not'],
  "doesn't": ['not'],
  "didn't": ['not'],
  "can't": ['can', 'not'],
  "won't": ['will', 'not'],
  "isn't": ['not'],
  "aren't": ['not'],
  im: ['i'],
  dont: ['not'],
  cant: ['can', 'not'],
  wont: ['will', 'not'],
  hi: ['hello'],
  hey: ['hello'],
  thanks: ['thank you'],
  thankyou: ['thank you'],
  thx: ['thank you'],
  bye: ['goodbye'],
  cya: ['goodbye'],
  ok: ['okay'],
  mom: ['mother'],
  mum: ['mother'],
  dad: ['father'],
  kid: ['child'],
  kids: ['child'],
  children: ['child'],
  home: ['house'],
  sick: ['ill'],
  illness: ['sick'],
  aid: ['help'],
  emergency: ['alert'],
  car: ['ambulance'],
  talk: ['speak'],
  say: ['tell'],
  big: ['large'],
  little: ['small'],
  glad: ['happy'],
  joy: ['happy'],
  joyful: ['happy'],
  scared: ['afraid'],
  fear: ['afraid'],
  hungry: ['food'],
  thirsty: ['water'],
  drink: ['water'],
  eat: ['food'],
  learn: ['study'],
  office: ['work']
};

const MULTIWORD_PHRASES = [
  ['good morning', 'good morning'],
  ['good afternoon', 'good afternoon'],
  ['good evening', 'good evening'],
  ['good night', 'good night'],
  ['how are you', 'how are you'],
  ['thank you', 'thank you'],
  ['excuse me', 'excuse me'],
  ['nice to meet you', 'welcome'],
  ['what is your name', 'name what'],
  ['my name is', 'my name']
];

const SIMPLE_SVO_PRONOUNS = new Set(['i', 'me', 'my', 'you', 'your', 'we', 'our', 'he', 'she', 'they', 'this', 'that']);

function resolveWordToSiGML(word, lookupMap) {
  if (!lookupMap || typeof lookupMap.get !== 'function') return null;

  const clean = word.toLowerCase().trim();
  if (!clean) return null;

  if (lookupMap.has(clean)) {
    return { item: lookupMap.get(clean), matchType: 'direct', matchedKey: clean };
  }

  // Stemmed singular check
  if (clean.endsWith('s') && clean.length > 2 && lookupMap.has(clean.slice(0, -1))) {
    const singular = clean.slice(0, -1);
    return { item: lookupMap.get(singular), matchType: 'direct', matchedKey: singular };
  }
  if (clean.endsWith('ing') && clean.length > 4 && lookupMap.has(clean.slice(0, -3))) {
    const base = clean.slice(0, -3);
    return { item: lookupMap.get(base), matchType: 'direct', matchedKey: base };
  }
  if (clean.endsWith('ed') && clean.length > 3 && lookupMap.has(clean.slice(0, -2))) {
    const base = clean.slice(0, -2);
    return { item: lookupMap.get(base), matchType: 'direct', matchedKey: base };
  }

  // Dictionary fallback names for core ISL phrases (e.g. "thank you" -> "thankyou")
  const compact = clean.replace(/\s+/g, '');
  if (compact !== clean && lookupMap.has(compact)) {
    return { item: lookupMap.get(compact), matchType: 'direct', matchedKey: compact };
  }

  // Synonym alias
  const alias = PRONOUN_AND_GRAMMAR_ALIASES[clean];
  if (Array.isArray(alias) && alias.length === 1) {
    const target = alias[0];
    if (lookupMap.has(target)) {
      return { item: lookupMap.get(target), matchType: 'synonym', matchedKey: target };
    }
    const compactAlias = target.replace(/\s+/g, '');
    if (lookupMap.has(compactAlias)) {
      return { item: lookupMap.get(compactAlias), matchType: 'synonym', matchedKey: compactAlias };
    }
  }

  // Sub-phrase match fallback (e.g., "name what" -> "namewhat")
  const words = clean.split(' ');
  if (words.length > 1) {
    for (const w of words) {
      if (lookupMap.has(w)) {
        return { item: lookupMap.get(w), matchType: 'synonym', matchedKey: w };
      }
    }
  }

  return null;
}

/**
 * Reorders content tokens into approximate Indian Sign Language (ISL) gloss order:
 * 1. Time markers first
 * 2. Subject / Topic
 * 3. Object / Complement (basic SOV shift when 3+ simple content tokens)
 * 4. Verb / Core predicate
 * 5. Clause-final Negation & WH-question markers
 */
export function buildIslGlossSequence(rawText) {
  const cleaned = String(rawText || '')
    .toLowerCase()
    .replace(/[^a-z0-9'\s?-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return [];

  const isQuestion = cleaned.includes('?');
  const prose = cleaned.replace(/\?/g, '').trim();
  if (!prose) return [];

  // Replace known multi-word idioms with placeholder tokens so they stay together
  let working = prose;
  const phraseTokens = new Map();
  MULTIWORD_PHRASES.forEach(([phrase, replacement], idx) => {
    const tokenKey = `__phrase_${idx}__`;
    if (working.includes(phrase)) {
      working = working.split(phrase).join(tokenKey);
      phraseTokens.set(tokenKey, replacement);
    }
  });

  const rawTokens = working.split(' ').filter(Boolean);
  const expanded = [];

  for (const tok of rawTokens) {
    if (phraseTokens.has(tok)) {
      expanded.push({ token: phraseTokens.get(tok), isPhrase: true });
      continue;
    }

    const aliasList = PRONOUN_AND_GRAMMAR_ALIASES[tok];
    if (aliasList && aliasList.length > 1) {
      aliasList.forEach((a) => expanded.push({ token: a, isPhrase: false }));
      continue;
    }

    const stripped = tok.replace(/'/g, '');
    if (!stripped) continue;
    if (ENGLISH_FUNCTION_WORDS_TO_DROP.has(stripped)) continue;
    expanded.push({ token: stripped, isPhrase: false });
  }

  // Partition into ISL syntactic slots
  const timeSlots = [];
  const whSlots = [];
  const negSlots = [];
  const coreSlots = [];

  for (const entry of expanded) {
    const t = entry.token;
    if (TIME_MARKERS.has(t)) {
      timeSlots.push(t);
    } else if (WH_WORDS.has(t)) {
      whSlots.push(t);
    } else if (NEGATION_WORDS.has(t)) {
      negSlots.push(t);
    } else {
      coreSlots.push(t);
    }
  }

  // Simple S-V-O -> S-O-V inversion when Subject + Verb + Object pattern detected
  let reorderedCore = [...coreSlots];
  if (
    reorderedCore.length === 3 &&
    SIMPLE_SVO_PRONOUNS.has(reorderedCore[0]) &&
    !SIMPLE_SVO_PRONOUNS.has(reorderedCore[1]) &&
    !SIMPLE_SVO_PRONOUNS.has(reorderedCore[2])
  ) {
    // Move Verb (index 1) after Object (index 2) -> [Subject, Object, Verb]
    reorderedCore = [reorderedCore[0], reorderedCore[2], reorderedCore[1]];
  }

  const ordered = [...timeSlots, ...reorderedCore, ...negSlots, ...whSlots];

  // Ensure question inflection cue if '?' present and no WH-word found
  if (isQuestion && whSlots.length === 0 && ordered.length > 0 && !ordered.includes('question')) {
    return ordered.map((t) => ({ gloss: t.toUpperCase(), normalized: t, isNonManualCue: false }));
  }

  return ordered.map((t) => ({ gloss: t.toUpperCase(), normalized: t, isNonManualCue: false }));
}

/**
 * Translates English text into a playable SiGML step queue with linguistic metadata.
 */
export function translateEnglishToISL(rawText, lookupMap) {
  const tokens = buildIslGlossSequence(rawText);
  if (tokens.length === 0) {
    return {
      glossOrder: [],
      steps: [],
      stats: { totalTokens: 0, directMatches: 0, synonymMatches: 0, fingerspelledWords: 0 },
      disclaimer: ISL_LINGUISTIC_DISCLAIMER
    };
  }

  const steps = [];
  let directMatches = 0;
  let synonymMatches = 0;
  let fingerspelledWords = 0;

  for (const tok of tokens) {
    const resolved = resolveWordToSiGML(tok.normalized, lookupMap);
    if (resolved) {
      if (resolved.matchType === 'direct') directMatches += 1;
      else synonymMatches += 1;

      steps.push({
        label: tok.gloss,
        displayWord: resolved.item.label || tok.gloss,
        file: resolved.item.resolvedPath || resolved.item.file,
        matchType: resolved.matchType,
        isFingerspell: false
      });
    } else {
      fingerspelledWords += 1;
      const alphanum = tok.normalized.replace(/[^a-z0-9]/g, '');
      for (const ch of alphanum) {
        const charItem = lookupMap?.get ? lookupMap.get(ch) : null;
        steps.push({
          label: `${tok.gloss} (${ch.toUpperCase()})`,
          displayWord: ch.toUpperCase(),
          file: charItem
            ? (charItem.resolvedPath || charItem.file)
            : `DictionarySigns/alphabets_single_handed/${ch}.sigml`,
          matchType: 'fingerspell',
          isFingerspell: true
        });
      }
    }
  }

  return {
    glossOrder: tokens.map((t) => t.gloss),
    steps,
    stats: {
      totalTokens: tokens.length,
      directMatches,
      synonymMatches,
      fingerspelledWords
    },
    disclaimer: ISL_LINGUISTIC_DISCLAIMER
  };
}
