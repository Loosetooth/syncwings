
import {
  randomInt,
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv
} from "crypto";
import * as zlib from "zlib";

/**
 * Generates a cryptographically secure random 16-character alphanumeric string (a-zA-Z0-9),
 * matching Filestash's secret_key requirements.
 */
export function generateFilestashSecretKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    const idx = randomInt(chars.length);
    result += chars[idx];
  }
  return result;
}


// --- Filestash custom Hash function (base62 encoding of SHA256 digest) ---
const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

export type FilestashDerivedKeys = {
  proof: string;
  admin: string;
  user: string;
  hash: string;
  signature: string;
};

/**
 * Derives all Filestash key variants from a secret key, matching Go's InitSecretDerivate.
 */
export function deriveFilestashKeys(secretKey: string): FilestashDerivedKeys {
  return {
    proof: filestashHash("PROOF_" + secretKey, secretKey.length),
    admin: filestashHash("ADMIN_" + secretKey, secretKey.length),
    user: filestashHash("USER_" + secretKey, secretKey.length),
    hash: filestashHash("HASH_" + secretKey, secretKey.length),
    signature: filestashHash("SGN_" + secretKey, secretKey.length),
  };
}

function reversedBaseChange(alphabet: string[], i: number): string {
  let str = "";
  do {
    str += alphabet[i % alphabet.length];
    i = Math.floor(i / alphabet.length);
  } while (i > 0);
  return str;
}

function hashSize(b: Buffer, n: number): string {
  let h = "";
  for (let i = 0; i < b.length; i++) {
    if (n > 0 && h.length >= n) break;
    h += reversedBaseChange(LETTERS, b[i]);
  }
  if (h.length > n) {
    return h.slice(0, n);
  }
  return h;
}

function filestashHash(str: string, n: number): string {
  const hash = createHash("sha256").update(str).digest();
  return hashSize(hash, n);
}

function getAesKey(secretKey: string): Buffer {
  const derivedKeys = deriveFilestashKeys(secretKey);
  const aesKeyStr = filestashHash(derivedKeys.proof, 16);
  let key = Buffer.alloc(16);
  Buffer.from(aesKeyStr, "utf-8").copy(key);
  return key;
}

export function base64urlToBuffer(str: string): Buffer {
  return Buffer.from(str, "base64url");
}

export function bufferToBase64url(buf: Buffer): string {
  // Use base64, then replace chars, but keep padding
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

function compressZlib(data: Buffer): Buffer {
  return zlib.deflateSync(data);
}

function decompressZlib(data: Buffer): Buffer {
  return zlib.inflateSync(data);
}

function encryptAESGCM(key: Buffer, data: Buffer): Buffer {
  const nonceSize = 12;
  const nonce = randomBytes(nonceSize);
  const cipher = createCipheriv("aes-128-gcm", key, nonce);
  const enc = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([nonce, enc, tag]);
}

function decryptAESGCM(key: Buffer, data: Buffer): Buffer {
  const nonceSize = 12;
  const nonce = data.subarray(0, nonceSize);
  const ciphertext = data.subarray(nonceSize);
  const tag = ciphertext.subarray(ciphertext.length - 16);
  const enc = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = createDecipheriv("aes-128-gcm", key, nonce);
  (decipher as any).setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}

/**
 * Encrypts a string using Filestash's config encryption logic.
 * Returns a base64url-encoded string.
 */
export function encryptFilestashConfig(secretKey: string, plaintext: string): string {
  const key = getAesKey(secretKey);
  const compressed = compressZlib(Buffer.from(plaintext, "utf-8"));
  const encrypted = encryptAESGCM(key, compressed);
  return bufferToBase64url(encrypted);
}

/**
 * Decrypts a Filestash config value using the secret key.
 * Returns the decrypted string.
 */
export function decryptFilestashConfig(secretKey: string, encrypted: string): string {
  const key = getAesKey(secretKey);
  const encryptedBuf = base64urlToBuffer(encrypted);
  const decrypted = decryptAESGCM(key, encryptedBuf);
  const decompressed = decompressZlib(decrypted);
  return decompressed.toString("utf-8");
}
