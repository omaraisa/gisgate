'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (session) {
    return (
      <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
        <h1>Profile</h1>
        <p>Welcome, {session.user?.name}</p>
        <p>Email: {session.user?.email}</p>
        <p>Role: {session.user?.role}</p>
        <button onClick={() => signOut({ callbackUrl: '/' })} style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none' }}>
          Sign Out
        </button>
      </div>
    );
  }

  return null;
}