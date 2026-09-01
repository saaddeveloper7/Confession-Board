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
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="mt-1 text-sm text-text-muted">
          We&apos;ll email you a link to reset it.
        </p>
      </div>

      {submitted ? (
        <div className="card space-y-4 p-6">
          <p className="alert-success">
            If that email exists, a reset link has been sent. Check your inbox.
          </p>
          <Link href="/login" className="app-link block text-center text-sm">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-5 p-6">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>

          <p className="text-center text-sm text-text-muted">
            <Link href="/login" className="app-link font-medium">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
