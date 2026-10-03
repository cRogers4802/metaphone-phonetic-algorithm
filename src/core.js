/**
 * Metaphone phonetic algorithm implementation.
 *
 * Based on Lawrence Philips' 1990 paper "Metaphone: A Modern Soundalike Function".
 * Produces a consonant-based phonetic encoding of English words, dropping
 * silent letters and collapsing some consonant clusters that sound alike.
 *
 * The implementation is a port of the widely-referenced C implementation
 * found in the DoubleMetaphone / Metaphone lineage. It is intentionally
 * conservative: it implements the classic Metaphone rules, not the later
 * Double Metaphone, and does not attempt to resolve every dialectal
 * ambiguity. One interpretation per rule, as the README states.
 */

// Vowels are represented, but only 'A', 'E', 'I', 'O', 'U' survive
// past the first transformation. 'Y' is treated as a vowel when it
// stands between consonants and has a vowel sound, and is dropped
// otherwise.
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/**
 * Is `ch` a vowel (including Y in its vowel role)?
 * @param {string} ch - single uppercase character
 * @returns {boolean}
 */
function isVowel(ch) {
  return VOWELS.has(ch) || ch === 'Y';
}

/**
 * Look at the character at `idx` of `word`, returning '' if out of range.
 * Bounds-safe access keeps the rule functions short.
 * @param {string} word
 * @param {number} idx
 * @returns {string}
 */
function at(word, idx) {
  return idx >= 0 && idx < word.length ? word[idx] : '';
}

/**
 * Substring starting at `start`, length `len`. Safe for overhang.
 * @param {string} word
 * @param {number} start
 * @param {number} len
 * @returns {string}
 */
function slice(word, start, len) {
  return word.slice(start, start + len);
}

/**
 * Apply the silent-letter and cluster-rewrite rules for the letter at `i`.
 * Returns the string to emit (may be empty), or `null` to signal that the
 * rule emitted and advanced past a digraph and the caller should skip.
 *
 * Returning a tuple of {emit, advance} would be cleaner but the classic
 * algorithm uses an index that the caller mutates; we mirror that by
 * returning the number of extra characters to skip.
 *
 * @returns {[string, number]} [emit, extraSkip]
 */
function transform(word, i, prev, next) {
  const c = at(word, i);
  const c1 = at(word, i + 1);
  const c2 = at(word, i + 2);
  const c3 = at(word, i + 3);

  // --- Special first-position rules (drop silent initials) ---
  if (i === 0) {
    // X- is pronounced Z at the start (e.g. "Xavier").
    if (c === 'X') return ['S', 0]; // emit S, caller advances normally; ZS collapsed below
    if (c === 'A' && c1 === 'E') return [slice(word, i, 2), 1];
    if (c === 'G' && c1 === 'N') return ['', 0]; // GN- -> N- ("gnome")
    if (c === 'K' && c1 === 'N') return ['', 0]; // KN- -> N- ("knife")
    if (c === 'P' && c1 === 'N') return ['', 0]; // PN- -> N- ("pneumonia")
    if (c === 'P' && c1 === 'S') return ['S', 1]; // PS- -> S- ("psychology")
    if (c === 'W' && c1 === 'R') return ['R', 1]; // WR- -> R- ("write")
    if (c === 'W' && c1 === 'H') {
      // WHO- -> HU- ("who"), otherwise WH- sounds like W ("where").
      if (c2 === 'O') return [slice(word, i, 2), 0];
      return ['W', 1];
    }
  }

  // --- General rules ---
  switch (c) {
    case 'B':
      // -MB is silent ("thumb"), but B alone elsewhere is real.
      if (prev !== 'M') return ['B', 0];
      return ['', 0];
    case 'C':
      // CH -> X ("machine"), CIA -> X ("special"), CI -> S ("grace")?
      // Classic Metaphone: CH -> X, CIA -> X, otherwise CI/S -> S, C else K.
      if (c1 === 'H') return ['X', 1];
      if (i === 0 && c1 === 'I' && (c2 === 'A' || c2 === 'E' || c2 === 'O'))
        return ['X', 1]; // initial CIA/CIE/CIO
      if (c1 === 'I' || c1 === 'E' || c1 === 'Y') return ['S', 0];
      return ['K', 0];
    case 'D':
      if (c1 === 'G' && (c2 === 'I' || c2 === 'E' || c2 === 'Y'))
        return ['J', 2]; // DGI/DGE/DGY -> J ("edgy")
      return ['T', 0];
    case 'F':
      return ['F', 0];
    case 'G':
      if (c1 === 'H') {
        // GH silent after vowel ("high"); as F after I at end ("laugh") handled
        // by the F rule being unreachable — here we drop GH when it's silent.
        if (i === 0) return ['K', 1]; // GH- -> K ("ghost")
        if (isVowel(prev)) return ['', 1]; // vowel + GH -> silent ("weight")
        return ['', 1];
      }
      if (c1 === 'N') return ['', 0]; // GN- in middle drops G ("sign")
      if ((c1 === 'I' || c1 === 'E' || c1 === 'Y') && prev !== 'G')
        return ['J', 0]; // soft G ("giant")
      return ['K', 0];
    case 'H':
      // H is silent after a vowel and not followed by vowel ("behind").
      if (isVowel(prev) && !isVowel(c1)) return ['', 0];
      return ['H', 0];
    case 'J':
      return ['J', 0];
    case 'K':
      return ['K', 0];
    case 'L':
      return ['L', 0];
    case 'M':
      return ['M', 0];
    case 'N':
      return ['N', 0];
    case 'P':
      if (c1 === 'H') return ['F', 1]; // PH -> F ("phone")
      return ['P', 0];
    case 'Q':
      return ['K', 0];
    case 'R':
      return ['R', 0];
    case 'S':
      if (c1 === 'H') return ['X', 1]; // SH -> X ("shoe")
      if (c1 === 'I' && (c2 === 'O' || c2 === 'A'))
        return ['X', 2]; // SIO/SIA -> X ("sion", "asia")
      if (c1 === 'Z') return ['X', 1]; // SZ -> X (rare)
      return ['S', 0];
    case 'T':
      if (c1 === 'H') return ['0', 1]; // TH -> 0 ("think"); 0 is theta
      if (c1 === 'I' && (c2 === 'O' || c2 === 'A'))
        return ['X', 2]; // TIO/TIA -> X ("nation")
      return ['T', 0];
    case 'V':
      return ['F', 0];
    case 'W':
    case 'Y':
      // W/Y are vowels in effect; only survive when followed by a vowel.
      if (isVowel(c1)) return [c, 0];
      return ['', 0];
    case 'X':
      // X is KS; but after a consonant it collapses to S.
      if (i === 0) return ['S', 0];
      return ['KS', 0];
    case 'Z':
      return ['S', 0];
    default:
      // Vowels: drop all but the first.
      return [i === 0 ? c : '', 0];
  }
}

/**
 * Generate the Metaphone encoding of an English word.
 *
 * Rules are applied left-to-right with a sliding index. Vowels after the
 * first letter are dropped; doubled letters collapse; TH maps to the
 * digit `0` (representing the English theta sound), as in the original.
 *
 * @param {string} word - input word
 * @returns {string} phonetic encoding
 */
export function metaphone(word) {
  if (typeof word !== 'string') {
    throw new TypeError('metaphone() expects a string');
  }
  const upper = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (upper.length === 0) return '';

  let result = '';
  let i = 0;

  // Always emit the first character's vowel (if it is one) per the paper.
  // We handle this by NOT dropping the first vowel inside the loop.
  while (i < upper.length) {
    const c = upper[i];
    const prev = i > 0 ? upper[i - 1] : '';

    // Skip doubled letters ("LL", "TT", etc.) — the second contributes nothing.
    if (i > 0 && c === prev) {
      i += 1;
      continue;
    }

    const [emit, extraSkip] = transform(upper, i, prev);
    result += emit;
    i += 1 + extraSkip;
  }

  return result;
}
