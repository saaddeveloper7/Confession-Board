'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getPublicProfile, getCurrentUser } from '../../../lib/auth';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function Placeholder({ username, size = 'w-24 h-24 text-3xl' }) {
  const letter = (username || '?').charAt(0).toUpperCase();
  return (
    <div
      className={`${size} flex items-center justify-center rounded-full bg-accent font-semibold text-accent-text`}
    >
      {letter}
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username;

  const [profile, setProfile] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const [profileData, currentUser] = await Promise.all([
          getPublicProfile(username),
          getCurrentUser().catch(() => null),
        ]);
        if (cancelled) return;
        setProfile(profileData);
        setMe(currentUser);
      } catch (err) {
        if (cancelled) return;
        if (/not found/i.test(err.message)) {
          setNotFound(true);
        } else {
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <p className="text-text-muted">Loading…</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold">User not found</h1>
        <p className="mb-4 text-text-muted">
          No user named &quot;{username}&quot; exists.
        </p>
        <Link href="/" className="app-link">
          ← Back to homepage
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <p className="alert-error">{error}</p>
      </main>
    );
  }

  const isOwnProfile = me && profile && me.id === profile.id;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="muted-link text-sm">
          ← Back
        </Link>
        {isOwnProfile && (
          <Link href="/settings" className="app-link text-sm">
            Edit profile
          </Link>
        )}
      </header>

      <section className="card flex flex-col items-center gap-5 p-7 text-center sm:flex-row sm:items-start sm:text-left">
        {profile.profile_picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profile_picture_url}
            alt={`${profile.username}'s avatar`}
            className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <Placeholder username={profile.username} />
        )}

        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          <p className="mt-0.5 text-xs text-text-muted">
            Member since {formatDate(profile.created_at)}
          </p>
          {profile.bio ? (
            <p className="mt-3 whitespace-pre-wrap text-text">{profile.bio}</p>
          ) : (
            <p className="mt-3 text-sm italic text-text-muted">No bio yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
