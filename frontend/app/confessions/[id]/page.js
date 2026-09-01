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
        <Link href="/" className="muted-link text-sm">
          ← Back to feed
        </Link>
      </header>

      {loading && <p className="text-text-muted">Loading…</p>}

      {error && <p className="alert-error">{error}</p>}

      {confession && (
        <article className="card p-7">
          <div className="mb-3 flex items-center justify-between text-sm text-text-muted">
            <span className="flex items-center gap-1.5 font-medium text-text">
              {confession.anonymous_username || 'Anonymous'}
              {moodEmoji(confession.mood) && (
                <span title={confession.mood}>{moodEmoji(confession.mood)}</span>
              )}
            </span>
            <span>{formatDate(confession.created_at)}</span>
          </div>

          {confession.category && (
            <span className="badge mb-3">{confession.category}</span>
          )}

          <p className="whitespace-pre-wrap text-lg leading-relaxed text-text">
            {confession.content}
          </p>

          <dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 border-t border-border pt-4 text-xs text-text-muted">
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
