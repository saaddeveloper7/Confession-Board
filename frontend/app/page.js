'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllConfessions, deleteConfession } from '../lib/api';
import { moodEmoji } from '../lib/utils';
import AuthStatus from '../components/AuthStatus';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function Home() {
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllConfessions();
      setConfessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this confession?')) return;
    try {
      await deleteConfession(id);
      setConfessions((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-6 flex justify-end">
        <AuthStatus />
      </div>

      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Confession Board</h1>
        <Link
          href="/new"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Post a Confession
        </Link>
      </header>

      {loading && <p className="text-slate-500">Loading…</p>}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && confessions.length === 0 && (
        <p className="text-slate-500">No confessions yet. Be the first.</p>
      )}

      <ul className="space-y-4">
        {confessions.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                {c.anonymous_username || 'Anonymous'}
                {moodEmoji(c.mood) && (
                  <span className="ml-1" title={c.mood}>{moodEmoji(c.mood)}</span>
                )}
              </span>
              <span>{formatDate(c.created_at)}</span>
            </div>

            {c.category && (
              <span className="mb-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {c.category}
              </span>
            )}

            <p className="whitespace-pre-wrap text-slate-800">{c.content}</p>

            <div className="mt-3 flex items-center gap-3 text-sm">
              <Link
                href={`/confessions/${c.id}`}
                className="text-slate-700 hover:underline"
              >
                View
              </Link>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
