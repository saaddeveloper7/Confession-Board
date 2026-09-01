'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllConfessions, deleteConfession } from '../lib/api';
import { moodEmoji } from '../lib/utils';
import AuthStatus from '../components/AuthStatus';
import ThemeSwitcher from '../components/ThemeSwitcher';

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
    <div className="min-h-full">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-text">
              C
            </span>
            <span className="font-display text-base font-bold tracking-tight">
              Confession Board
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <div className="hidden h-5 w-px bg-border sm:block" />
            <AuthStatus />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">The feed</h1>
            <p className="mt-1 text-sm text-text-muted">
              Anonymous confessions from across the board.
            </p>
          </div>
          <Link href="/new" className="btn-primary whitespace-nowrap">
            + Post a confession
          </Link>
        </div>

        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card animate-pulse p-5">
                <div className="mb-3 h-3 w-32 rounded bg-border" />
                <div className="mb-2 h-3 w-full rounded bg-border" />
                <div className="h-3 w-2/3 rounded bg-border" />
              </div>
            ))}
          </div>
        )}

        {error && <p className="alert-error">{error}</p>}

        {!loading && !error && confessions.length === 0 && (
          <div className="card flex flex-col items-center gap-2 px-4 py-16 text-center">
            <span className="text-3xl">🤫</span>
            <p className="font-display text-lg font-semibold">No confessions yet</p>
            <p className="text-sm text-text-muted">Be the first to share something.</p>
            <Link href="/new" className="btn-primary mt-3">
              Post a confession
            </Link>
          </div>
        )}

        <ul className="space-y-4">
          {confessions.map((c) => (
            <li
              key={c.id}
              className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1.5 font-medium text-text">
                  {c.anonymous_username || 'Anonymous'}
                  {moodEmoji(c.mood) && (
                    <span title={c.mood}>{moodEmoji(c.mood)}</span>
                  )}
                </span>
                <span>{formatDate(c.created_at)}</span>
              </div>

              {c.category && <span className="badge mb-2">{c.category}</span>}

              <p className="whitespace-pre-wrap text-text">{c.content}</p>

              <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-sm">
                <Link href={`/confessions/${c.id}`} className="app-link">
                  View
                </Link>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-text-muted transition hover:text-red-500"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
