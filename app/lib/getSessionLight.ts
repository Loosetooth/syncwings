import { NextRequest } from "next/server";
import { verifySessionJWT } from "./jwtHelpers";

/**
 * Retrieves a lightweight session object from the request.
 * This function extracts the session token from the request cookies,
 * verifies it, and returns a simplified session object containing
 * the username and index if the token is valid.
 * If the token is invalid or not present, it returns null.
 * @param req - The NextRequest object containing the request data.
 * @returns A Promise that resolves to a session object with username and index, or null if the session is invalid or not present.
 */
export const getSessionLight = async (req: NextRequest) => {
  const cookie = req.headers.get('cookie');
  let token = '';
  if (cookie) {
    const match = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('session='));
    if (match) {
      token = decodeURIComponent(match.split('=')[1]);
    }
  }
  if (!token) return null;

  try {
    const payload = await verifySessionJWT(token);
    if (!payload || !payload.username) return null;
    return { username: payload.username, index: payload.index };
  } catch (e) {
    console.error('Session verification failed:', e);
    return null;
  }
}