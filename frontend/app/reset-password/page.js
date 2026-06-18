'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword, verifyResetToken } from '../../lib/auth';

function InvalidLinkBanner({ message = 'Invalid or expired reset link' }) {
  return (
    <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5">
      <p className="text-sm text-red-800">{message}</p>
      <Link href="/forgot-password" className="block text-sm text-slate-800 underline">
        Request a new reset link
      </Link>
    </div>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // null = still verifying, true = valid, false = invalid/expired
  const [tokenValid, setTokenValid] = useState(token ? null : false);
  const [verifyError, setVerifyError] = useState(
    token ? null : 'Invalid reset link'
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const result = await verifyResetToken(token);
      if (cancelled) return;
      if (result?.valid) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setVerifyError(result?.error || 'Invalid or expired reset link');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => router.push('/login'), 2000);
      return () => clearTimeout(t);
    }
  }, [success, router]);

  if (tokenValid === null) {
    return <p className="text-sm text-slate-500">Verifying link…</p>;
  }

  if (tokenValid === false) {
    return <InvalidLinkBanner message={verifyError} />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-5 text-sm text-green-800">
        Password reset successfully! Redirecting to login…
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Confirm New Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-slate-500"
        />
      </div>

      {error && (
        <div className="space-y-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
          {error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid') ? (
            <Link href="/forgot-password" className="block text-slate-800 underline">
              Request a new reset link
            </Link>
          ) : null}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? 'Resetting…' : 'Reset password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Reset Password</h1>
        <Link href="/login" className="text-sm text-slate-600 hover:underline">
          ← Back to login
        </Link>
      </header>

      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <ResetPasswordInner />
      </Suspense>
    </main>
  );
}
