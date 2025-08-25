import { bufferToBase64url, base64urlToBuffer } from './crypto';
import { describe, it, expect } from 'vitest';
import { encryptFilestashConfig, decryptFilestashConfig, generateFilestashSecretKey } from './crypto';

const secretKey = 'vIbdVeu77i1dtX2l';
const encrypted = '6HoBc1zE4iysloguKSWk5op6kAj-j_N7loY4KfvDIltZXW6JyqVxWjvnOX3mWYGyhYIVZHe-4lOWYHLrvoPIx5nQlMQ=';
const decryptedValue = '{"strategy":"password_only"}';

describe('Filestash crypto helpers', () => {
  it('decrypts a known value', () => {
    const decrypted = decryptFilestashConfig(secretKey, encrypted);
    expect(decrypted).toBe(decryptedValue);
  });

  it('encrypts and decrypts round-trip', () => {
    const reEncrypted = encryptFilestashConfig(secretKey, decryptedValue);
    const roundTrip = decryptFilestashConfig(secretKey, reEncrypted);
    expect(roundTrip).toBe(decryptedValue);
  });

  it('generates a valid secret key', () => {
    const key = generateFilestashSecretKey();
    expect(key).toMatch(/^[a-zA-Z0-9]{16}$/);
  });

  it('encrypts to a different value each time', () => {
    const enc1 = encryptFilestashConfig(secretKey, decryptedValue);
    const enc2 = encryptFilestashConfig(secretKey, decryptedValue);
    expect(enc1).not.toBe(enc2);
    // Both should decrypt to the same value
    expect(decryptFilestashConfig(secretKey, enc1)).toBe(decryptedValue);
    expect(decryptFilestashConfig(secretKey, enc2)).toBe(decryptedValue);
  });

  it('produces values compatible with another filestash config', () => {
    // Test with actual values from the config.json file  
    const actualSecretKey = 'vIbdVeu77i1dtX2l';
    const actualEncryptedParams = '6HoBc1zE4iysloguKSWk5op6kAj-j_N7loY4KfvDIltZXW6JyqVxWjvnOX3mWYGyhYIVZHe-4lOWYHLrvoPIx5nQlMQ=';
    const expectedDecrypted = '{"strategy":"password_only"}';
    
    // First verify we can decrypt the actual filestash value
    const decrypted = decryptFilestashConfig(actualSecretKey, actualEncryptedParams);
    expect(decrypted).toBe(expectedDecrypted);
    
    // Now encrypt the same value and verify it decrypts correctly
    const ourEncrypted = encryptFilestashConfig(actualSecretKey, expectedDecrypted);
    const roundTrip = decryptFilestashConfig(actualSecretKey, ourEncrypted);
    expect(roundTrip).toBe(expectedDecrypted);
  });

  it('encodes and decodes ascii string correctly', () => {
    const input = 'hello world!';
    const buf = Buffer.from(input, 'utf-8');
    const encoded = bufferToBase64url(buf);
    const decoded = base64urlToBuffer(encoded);
    expect(decoded.toString('utf-8')).toBe(input);
  });
  
  it('encodes and decodes binary data correctly', () => {
    const input = Buffer.from([0, 255, 100, 200, 50, 0, 1, 2, 3, 4, 5]);
    const encoded = bufferToBase64url(input);
    const decoded = base64urlToBuffer(encoded);
    expect(decoded.equals(input)).toBe(true);
  });
  
  it('decodes Go base64.URLEncoding output', () => {
    // This is base64.URLEncoding of 'hello world!'
    const goEncoded = 'aGVsbG8gd29ybGQh';
    const decoded = base64urlToBuffer(goEncoded);
    expect(decoded.toString('utf-8')).toBe('hello world!');
  });
  
  it('handles padding and no padding', () => {
    const padded = 'aGVsbG8='; // 'hello' with padding
    const unpadded = 'aGVsbG8'; // 'hello' without padding
    expect(base64urlToBuffer(padded).toString('utf-8')).toBe('hello');
    expect(base64urlToBuffer(unpadded).toString('utf-8')).toBe('hello');
  });

  it('bufferToBase64url output is always padded to a multiple of 4', () => {
    const inputs = [
      Buffer.from('hello'),
      Buffer.from('hello world!'),
      Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
      Buffer.from('a'.repeat(15)),
      Buffer.from('a'.repeat(16)),
      Buffer.from('a'.repeat(17)),
    ];
    for (const buf of inputs) {
      const encoded = bufferToBase64url(buf);
      expect(encoded.length % 4).toBe(0);
      // If not empty, should end with 0-2 '='
      if (encoded.length > 0) {
        expect(encoded.endsWith('=') || encoded.endsWith('==') || !encoded.includes('=')).toBe(true);
      }
    }
  });
});
