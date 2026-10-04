# Metaphone

A small, zero-dependency TypeScript-free pure-ESM JavaScript implementation of the classic Metaphone phonetic algorithm. Pass an English word, get back a consonant-based code that groups words by similar pronunciation.

## Usage

```js
import { metaphone } from './src/index.js';

metaphone('knife');   // 'NF'
metaphone('phone');   // 'FN'
metaphone('think');   // '0NK'
```

The module also exports a default object: `import metaphoneLib from './src/index.js'` then `metaphoneLib.metaphone('cat')`.

## Why

Soundex collapses every word to a letter plus three digits, which is too coarse for most English vocabulary. Metaphone keeps more phonetic detail: it maps TH to the digit `0` (theta), SH and the fricative CH to `X`, PH to `F`, and drops silent letters like the K in KNIFE and the G in GNARL.

This library implements the 1990 single-stage Metaphone, not Double Metaphone. Double Metaphone returns two codes per word to handle dialect variation; that is more work to consume and more surprising in tests. One code, one interpretation.

## Edges you will hit

- The output contains the digit `0` where the input has TH. That is the original Metaphone convention for the voiceless theta. It is not a bug and it is not optional; if your downstream system rejects digits, strip them yourself.
- Non-alphabetic characters are stripped before encoding, so `metaphone('123')` returns `''`.
- The algorithm is English-only. Non-English input will produce codes, but they are meaningless.
- Only the `metaphone` function is exported. There is no streaming API and no configuration object; the rules are fixed.
