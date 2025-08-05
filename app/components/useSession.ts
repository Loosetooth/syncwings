"use client";
import { useEffect, useState } from "react";

export interface SessionInfo {
  loggedIn: boolean;
  username?: string;
  isAdmin?: boolean;
}

export function useSession() {
  const [session, setSession] = useState<SessionInfo>({ loggedIn: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchSession() {
      setLoading(true);
      try {
        const res = await fetch("/api/session");
        const data = await res.json();
        if (!ignore) setSession(data);
      } catch {
        if (!ignore) setSession({ loggedIn: false });
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchSession();
    return () => { ignore = true; };
  }, []);

  return { ...session, loading };
}
