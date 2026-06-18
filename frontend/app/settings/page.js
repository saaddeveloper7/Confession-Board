'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCurrentUser,
  updateMyProfile,
  changeMyPassword,
  uploadMyAvatar,
} from '../../lib/auth';

const BIO_MAX = 200;

function Placeholder({ username }) {
  const letter = (username || '?').charAt(0).toUpperCase();
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-3xl font-semibold text-slate-600">
      {letter}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Section A — profile fields
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileErr, setProfileErr] = useState(null);

  // Section B — password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [pwErr, setPwErr] = useState(null);

  // Section C — avatar
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState(null);
  const [avatarErr, setAvatarErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await getCurrentUser();
      if (cancelled) return;
      if (!me) {
        router.push('/login');
        return;
      }
      setUser(me);
      setUsername(me.username || '');
      setBio(me.bio || '');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    setProfileSaving(true);
    try {
      const updates = {};
      if (username !== user.username) updates.username = username;
      if (bio !== (user.bio || '')) updates.bio = bio;

      if (Object.keys(updates).length === 0) {
        setProfileMsg('No changes to save.');
        setProfileSaving(false);
        return;
      }

      const updated = await updateMyProfile(updates);
      setUser(updated);
      setProfileMsg('Profile updated.');
    } catch (err) {
      setProfileErr(err.message);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);

    if (newPassword !== confirmPassword) {
      setPwErr('New password and confirmation do not match.');
      return;
    }

    setPwSaving(true);
    try {
      await changeMyPassword({ currentPassword, newPassword });
      setPwMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwErr(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null;
    setAvatarMsg(null);
    setAvatarErr(null);
    setSelectedFile(file);
  }

  async function handleAvatarUpload(e) {
    e.preventDefault();
    if (!selectedFile) {
      setAvatarErr('Choose a file first.');
      return;
    }
    setAvatarMsg(null);
    setAvatarErr(null);
    setAvatarSaving(true);
    try {
      const { profile_picture_url } = await uploadMyAvatar(selectedFile);
      setUser((prev) => ({ ...prev, profile_picture_url }));
      setSelectedFile(null);
      setAvatarMsg('Profile picture updated.');
    } catch (err) {
      setAvatarErr(err.message);
    } finally {
      setAvatarSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <p className="text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Settings</h1>
        <Link href="/" className="text-sm text-slate-600 hover:underline">
          ← Back
        </Link>
      </header>

      {/* Section A — Edit profile */}
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Edit profile</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-slate-500"
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {bio.length}/{BIO_MAX}
            </p>
          </div>

          {profileErr && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {profileErr}
            </p>
          )}
          {profileMsg && (
            <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {profileMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {profileSaving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </section>

      {/* Section B — Change password */}
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Change password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              New password
            </label>
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
              Confirm new password
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

          {pwErr && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {pwErr}
            </p>
          )}
          {pwMsg && (
            <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {pwMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={pwSaving}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {pwSaving ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </section>

      {/* Section C — Profile picture */}
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Profile picture</h2>
        <form onSubmit={handleAvatarUpload} className="space-y-4">
          <div className="flex items-center gap-5">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-300"
              />
            ) : user.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profile_picture_url}
                alt="Current avatar"
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <Placeholder username={user.username} />
            )}

            <div className="flex-1">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1 file:text-slate-700 hover:file:bg-slate-300"
              />
              <p className="mt-1 text-xs text-slate-500">JPG, PNG, or WebP. Max 2MB.</p>
            </div>
          </div>

          {avatarErr && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {avatarErr}
            </p>
          )}
          {avatarMsg && (
            <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {avatarMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={avatarSaving || !selectedFile}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {avatarSaving ? 'Uploading…' : 'Upload'}
          </button>
        </form>
      </section>
    </main>
  );
}
