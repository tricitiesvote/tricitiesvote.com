import { randomBytes } from 'crypto';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generatePublicId(length = 6): string {
  const bytes = randomBytes(length);
  let output = '';

  for (let i = 0; i < length; i += 1) {
    const index = bytes[i] % ALPHABET.length;
    output += ALPHABET[index];
  }

  return output;
}
