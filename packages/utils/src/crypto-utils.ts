const buf32 = new Uint32Array(1);
const crypto = globalThis.crypto || (typeof window !== 'undefined' && window.crypto);
if (!crypto?.getRandomValues) throw new Error('Crypto API not available');

// Direct functions - each inlined for maximum performance
export function generateOTP5(): string {
  while (true) {
    crypto.getRandomValues(buf32);
    if (buf32[0]! < 4294950000) {
      return String(10000 + (buf32[0]! % 90000));
    }
  }
}

export function generateOTP6(): string {
  while (true) {
    crypto.getRandomValues(buf32);
    if (buf32[0]! < 4294000000) {
      return String(100000 + (buf32[0]! % 900000));
    }
  }
}

export function generateOTP7(): string {
  while (true) {
    crypto.getRandomValues(buf32);
    if (buf32[0]! < 4293000000) {
      return String(1000000 + (buf32[0]! % 9000000));
    }
  }
}

export function generateOTP8(): string {
  while (true) {
    crypto.getRandomValues(buf32);
    if (buf32[0]! < 4230000000) {
      return String(10000000 + (buf32[0]! % 90000000));
    }
  }
}
