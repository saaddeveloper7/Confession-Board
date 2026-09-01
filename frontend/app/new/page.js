'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createConfession } from '../../lib/api';

const CATEGORIES = ['Relationships', 'Work', 'School', 'Life', 'Funny'];

export default function NewConfessionPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Please write something before posting.');
      return;
    }

    setSubmitting(true);
    try {
      await createConfession({ content: content.trim(), category });
      router.push('/');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">New confession</h1>
        <Link href="/" className="muted-link text-sm">
          ← Back to feed
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <div>
          <label className="label">Confession</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            placeholder="Spill it…"
            className="input-field resize-y"
          />
          <p className="mt-1 text-right text-xs text-text-muted">
            {content.length}/500
          </p>
        </div>

        <div>
          <label className="label">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {error &&
          (error.startsWith('Your confession was flagged') ? (
            <div className="alert-warn">
              <p className="font-semibold">⚠ Flagged by moderation</p>
              <p className="mt-0.5">
                {error.replace(/^Your confession was flagged:\s*/, '')}
              </p>
            </div>
          ) : (
            <p className="alert-error">{error}</p>
          ))}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Posting…' : 'Post confession'}
        </button>
      </form>
    </main>
  );
}
