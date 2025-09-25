'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <>
        {session.user?.name}
        <button onClick={() => signOut()} style={{ marginLeft: '10px' }}>Sign Out</button>
      </>
    );
  }

  return (
    <>
      <Link href="/login" style={{ marginRight: '10px' }}>
        Login
      </Link>
      <Link href="/register">
        Register
      </Link>
    </>
  );
}