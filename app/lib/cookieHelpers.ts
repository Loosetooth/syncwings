
import { signSessionJWT, SessionPayload } from './jwtHelpers';

export async function makeSessionCookie(payload: SessionPayload, maxAgeSeconds: number = 60 * 60 * 24 * 7) {
  const token = await signSessionJWT(payload, maxAgeSeconds);
  return `session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return 'session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0';
}
