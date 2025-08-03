"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncthingPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();


  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/session')
      .then(res => res.json())
      .then(data => {
        if (!data.loggedIn) {
          router.replace('/login');
        }
        setLoading(false);
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  if (loading) return null;
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <iframe
        ref={iframeRef}
        src="/api/proxy-syncthing"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Syncthing GUI"
      />
    </div>
  );
}
