'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword, verifyResetToken } from '../../lib/auth';

function InvalidLinkBanner({ message = 'Invalid or expired reset link' }) {
  return (
    <div className="card space-y-3 p-6">
      <p className="alert-error">{message}</p>
      <Link href="/forgot-password" className="app-link block text-sm">
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
    return <p className="text-sm text-text-muted">Verifying link…</p>;
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
      <div className="card p-6">
        <p className="alert-success">
          Password reset successfully! Redirecting to login…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6">
      <div>
        <label className="label">New password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          className="input-field"
        />
      </div>

      <div>
        <label className="label">Confirm new password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="input-field"
        />
      </div>

      {error && (
        <div className="alert-error space-y-2">
          <p>{error}</p>
          {error.toLowerCase().includes('expired') ||
          error.toLowerCase().includes('invalid') ? (
            <Link href="/forgot-password" className="block font-semibold underline">
              Request a new reset link
            </Link>
          ) : null}
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Resetting…' : 'Reset password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="mt-1 text-sm text-text-muted">Choose a new password.</p>
      </div>

      <Suspense fallback={<p className="text-center text-sm text-text-muted">Loading…</p>}>
        <ResetPasswordInner />
      </Suspense>
    </main>
  );
}
