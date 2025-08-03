"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    fetch('/api/logout', { method: 'POST' })
      .then(() => {
        router.replace('/login');
      });
  }, [router]);
  return <div>Logging out...</div>;
}
