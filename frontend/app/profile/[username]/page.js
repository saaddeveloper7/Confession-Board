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
      className={`${size} flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600`}
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
        <p className="text-slate-500">Loading…</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-semibold text-slate-800">User not found</h1>
        <p className="mb-4 text-slate-600">No user named &quot;{username}&quot; exists.</p>
        <Link href="/" className="text-slate-700 underline">
          ← Back to homepage
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      </main>
    );
  }

  const isOwnProfile = me && profile && me.id === profile.id;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-slate-600 hover:underline">
          ← Back
        </Link>
        {isOwnProfile && (
          <Link href="/settings" className="text-sm text-slate-700 underline">
            Edit profile
          </Link>
        )}
      </header>

      <section className="flex items-start gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {profile.profile_picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profile_picture_url}
            alt={`${profile.username}'s avatar`}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <Placeholder username={profile.username} />
        )}

        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-800">{profile.username}</h1>
          <p className="text-xs text-slate-500">
            Member since {formatDate(profile.created_at)}
          </p>
          {profile.bio ? (
            <p className="mt-3 whitespace-pre-wrap text-slate-700">{profile.bio}</p>
          ) : (
            <p className="mt-3 text-sm italic text-slate-400">No bio yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
