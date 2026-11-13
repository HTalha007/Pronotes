/**
 * Pure, environment-independent byte helpers (no `btoa`/`atob`/Buffer), so the
 * domain layer runs unchanged in browsers, Web Workers and Node (tests).
 */
const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = bytes[i + 1] ?? 0;
    const b2 = bytes[i + 2] ?? 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    out += BASE64_ALPHABET.charAt((n >> 18) & 63);
    out += BASE64_ALPHABET.charAt((n >> 12) & 63);
    out += i + 1 < bytes.length ? BASE64_ALPHABET.charAt((n >> 6) & 63) : '=';
    out += i + 2 < bytes.length ? BASE64_ALPHABET.charAt(n & 63) : '=';
  }
  return out;
}

/** @throws Error when the input contains characters outside the base64 alphabet. */
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const char of clean) {
    const value = BASE64_ALPHABET.indexOf(char);
    if (value < 0) {
      throw new Error('Invalid base64 input.');
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[index++] = (buffer >> bits) & 0xff;
      buffer &= (1 << bits) - 1;
    }
  }
  return out;
}

export function utf8Encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
