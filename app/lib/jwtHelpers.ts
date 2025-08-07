// jwtHelpers.ts

import { SignJWT, jwtVerify } from 'jose';

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set');
}
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// jose requires a Uint8Array key
function getSecretKey() {
  return new TextEncoder().encode(SESSION_SECRET);
}

export interface SessionPayload {
  username: string;
  index: number;
  // Add more fields if needed
}

export async function signSessionJWT(payload: SessionPayload, maxAgeSeconds: number = DEFAULT_MAX_AGE): Promise<string> {
  // jose SignJWT is async and requires claims to be set explicitly
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + maxAgeSeconds;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(getSecretKey());
}

export async function verifySessionJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    // payload is a Record<string, unknown>
    if (typeof payload.username === 'string' && typeof payload.index === 'number') {
      return { username: payload.username, index: payload.index };
    }
    return null;
  } catch (e) {
    console.error('Session verification failed:', e);
    return null;
  }
}
