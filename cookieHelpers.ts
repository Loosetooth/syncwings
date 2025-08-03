// cookieHelpers.ts

export function makeSessionCookie(username: string, maxAgeSeconds: number = 60 * 60 * 24 * 7) {
  return `session=${encodeURIComponent(username)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return 'session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0';
}
