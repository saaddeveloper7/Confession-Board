'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUser, logout } from '../lib/auth';

function AvatarCircle({ user }) {
  if (user.profile_picture_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.profile_picture_url}
        alt={`${user.username}'s avatar`}
        className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
      />
    );
  }
  const letter = (user.username || '?').charAt(0).toUpperCase();
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-text">
      {letter}
    </div>
  );
}

export default function AuthStatus() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getCurrentUser();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogout() {
    logout();
    window.location.reload();
  }

  if (loading) {
    return <div className="text-sm text-text-muted">…</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link
          href={`/profile/${user.username}`}
          className="flex items-center gap-2 text-text transition hover:text-accent"
        >
          <AvatarCircle user={user} />
          <span className="hidden sm:inline">
            Hi, <span className="font-semibold">{user.username}</span>
          </span>
        </Link>
        <Link href="/settings" className="muted-link">
          Settings
        </Link>
        <button onClick={handleLogout} className="btn-secondary">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/login" className="muted-link">
        Login
      </Link>
      <Link href="/register" className="btn-primary">
        Register
      </Link>
    </div>
  );
}
