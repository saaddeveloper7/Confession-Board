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
        className="h-7 w-7 rounded-full object-cover"
      />
    );
  }
  const letter = (user.username || '?').charAt(0).toUpperCase();
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
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
    return <div className="text-sm text-slate-400">…</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link
          href={`/profile/${user.username}`}
          className="flex items-center gap-2 text-slate-700 hover:underline"
        >
          <AvatarCircle user={user} />
          <span>
            Hi, <span className="font-medium">{user.username}</span>
          </span>
        </Link>
        <Link href="/settings" className="text-slate-700 hover:underline">
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="rounded-md border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-100"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/login" className="text-slate-700 hover:underline">
        Login
      </Link>
      <Link
        href="/register"
        className="rounded-md bg-slate-800 px-3 py-1 text-white hover:bg-slate-700"
      >
        Register
      </Link>
    </div>
  );
}
