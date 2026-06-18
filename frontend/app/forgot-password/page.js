'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '../../lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword(email);
    } catch {
      // Backend always returns success to prevent enumeration; even if a
      // network error happens we still show the same generic message.
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Forgot Password</h1>
        <Link href="/login" className="text-sm text-slate-600 hover:underline">
          ← Back to login
        </Link>
      </header>

      {submitted ? (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            If that email exists, a reset link has been sent. Check your inbox.
          </p>
          <Link href="/login" className="block text-center text-sm text-slate-700 underline">
            Back to login
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>

          <p className="text-center text-sm text-slate-600">
            <Link href="/login" className="text-slate-800 underline">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
