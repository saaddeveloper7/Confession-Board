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
        <h1 className="text-2xl font-semibold text-slate-800">New Confession</h1>
        <Link href="/" className="text-sm text-slate-600 hover:underline">
          ← Back to feed
        </Link>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Confession
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            placeholder="Spill it…"
            className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-slate-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {error && (
          error.startsWith('Your confession was flagged') ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p className="font-semibold">⚠ Flagged by moderation</p>
              <p className="mt-0.5">{error.replace(/^Your confession was flagged:\s*/, '')}</p>
            </div>
          ) : (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? 'Posting…' : 'Post Confession'}
        </button>
      </form>
    </main>
  );
}
