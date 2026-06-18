'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getConfessionById } from '../../../lib/api';
import { moodEmoji } from '../../../lib/utils';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function ConfessionDetailPage() {
  const { id } = useParams();
  const [confession, setConfession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getConfessionById(id);
        if (!cancelled) setConfession(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6">
        <Link href="/" className="text-sm text-slate-600 hover:underline">
          ← Back to feed
        </Link>
      </header>

      {loading && <p className="text-slate-500">Loading…</p>}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {confession && (
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
            <span className="font-medium text-slate-700">
              {confession.anonymous_username || 'Anonymous'}
              {moodEmoji(confession.mood) && (
                <span className="ml-1" title={confession.mood}>
                  {moodEmoji(confession.mood)}
                </span>
              )}
            </span>
            <span>{formatDate(confession.created_at)}</span>
          </div>

          {confession.category && (
            <span className="mb-3 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {confession.category}
            </span>
          )}

          <p className="whitespace-pre-wrap text-lg leading-relaxed text-slate-800">
            {confession.content}
          </p>

          <dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs text-slate-500">
            <dt>ID</dt>
            <dd className="break-all">{confession.id}</dd>
            <dt>Created</dt>
            <dd>{formatDate(confession.created_at)}</dd>
          </dl>
        </article>
      )}
    </main>
  );
}
