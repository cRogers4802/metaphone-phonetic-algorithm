import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metaphone } from '../src/index.js';

test('empty string returns empty string', () => {
  assert.equal(metaphone(''), '');
});

test('non-alphabetic input is stripped to empty', () => {
  assert.equal(metaphone('123!@#'), '');
});

test('preserves leading vowel', () => {
  // Leading vowels are kept per the algorithm.
  assert.equal(metaphone('apple'), 'APL');
  assert.equal(metaphone('elephant'), 'ELFNT');
});

test('silent initial letters are dropped', () => {
  // KN, GN, PN, WR lose the first consonant.
  assert.equal(metaphone('knife'), 'NF');
  assert.equal(metaphone('gnarl'), 'NRL');
  assert.equal(metaphone('write'), 'RT');
});

test('PH maps to F', () => {
  assert.equal(metaphone('phone'), 'FN');
  assert.equal(metaphone('graph'), 'KRF');
});

test('TH maps to 0 (theta)', () => {
  // The digit 0 represents the English voiceless theta.
  assert.equal(metaphone('think'), '0NK');
  assert.equal(metaphone('the'), '0');
});

test('SH maps to X', () => {
  assert.equal(metaphone('shoe'), 'X');
  assert.equal(metaphone('push'), 'PX');
});

test('CH maps to X for the fricative', () => {
  // CH -> X per classic Metaphone (no dialect split).
  assert.equal(metaphone('machine'), 'MXN');
});

test('C is soft before I, E, Y', () => {
  assert.equal(metaphone('city'), 'ST');
  assert.equal(metaphone('center'), 'SNTR');
});

test('C is hard otherwise', () => {
  assert.equal(metaphone('cat'), 'KT');
});

test('X emits KS in non-initial position', () => {
  assert.equal(metaphone('fox'), 'FKS');
  assert.equal(metaphone('exit'), 'EKST');
});

test('doubled letters collapse', () => {
  assert.equal(metaphone('balloon'), 'BLN');
  assert.equal(metaphone('bottle'), 'BTL');
});

test('MB is silent at end', () => {
  assert.equal(metaphone('thumb'), '0M');
});

test('throws on non-string input', () => {
  assert.throws(() => metaphone(42), TypeError);
  assert.throws(() => metaphone(null), TypeError);
});

test('case-insensitive', () => {
  assert.equal(metaphone('KNIFE'), metaphone('knife'));
  assert.equal(metaphone('PhOnE'), metaphone('phone'));
});
