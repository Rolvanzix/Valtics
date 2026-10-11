import { Buffer } from 'buffer';

/**
 * Clean pure-JS implementation of bigint-buffer conversions
 * Prevents native C++ binding warnings in browser and Node environments.
 */

/**
 * Convert a little-endian buffer into a BigInt.
 */
export function toBigIntLE(buf: Buffer | Uint8Array): bigint {
  const reversed = Buffer.from(buf);
  reversed.reverse();
  const hex = reversed.toString('hex');
  if (hex.length === 0) {
    return BigInt(0);
  }
  return BigInt(`0x${hex}`);
}

/**
 * Convert a big-endian buffer into a BigInt.
 */
export function toBigIntBE(buf: Buffer | Uint8Array): bigint {
  const hex = Buffer.from(buf).toString('hex');
  if (hex.length === 0) {
    return BigInt(0);
  }
  return BigInt(`0x${hex}`);
}

/**
 * Convert a BigInt to a little-endian buffer.
 */
export function toBufferLE(num: bigint, width: number): Buffer {
  const hex = num.toString(16);
  const buffer = Buffer.from(hex.padStart(width * 2, '0').slice(0, width * 2), 'hex');
  buffer.reverse();
  return buffer;
}

/**
 * Convert a BigInt to a big-endian buffer.
 */
export function toBufferBE(num: bigint, width: number): Buffer {
  const hex = num.toString(16);
  return Buffer.from(hex.padStart(width * 2, '0').slice(0, width * 2), 'hex');
}

export default {
  toBigIntLE,
  toBigIntBE,
  toBufferLE,
  toBufferBE,
};
