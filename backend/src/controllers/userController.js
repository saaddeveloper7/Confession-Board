const bcrypt = require('bcrypt');
const path = require('path');
const supabase = require('../config/supabase');

const SALT_ROUNDS = 10;
const USERNAME_REGEX = /^[A-Za-z0-9_]{3,20}$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_BIO_LENGTH = 200;
const AVATAR_BUCKET = 'profile-pictures';
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function publicProfile(row) {
  return {
    id: row.id,
    username: row.username,
    bio: row.bio,
    profile_picture_url: row.profile_picture_url,
    created_at: row.created_at,
  };
}

function fullUser(row) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    bio: row.bio,
    profile_picture_url: row.profile_picture_url,
    created_at: row.created_at,
  };
}

// GET /api/users/:username
async function getPublicProfile(req, res) {
  try {
    const { username } = req.params;

    if (typeof username !== 'string' || !USERNAME_REGEX.test(username)) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, bio, profile_picture_url, created_at')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ user: publicProfile(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PATCH /api/users/me  (requires requireAuth)
async function updateProfile(req, res) {
  try {
    const { username, bio } = req.body || {};
    const updates = {};

    if (username !== undefined) {
      if (typeof username !== 'string' || !USERNAME_REGEX.test(username)) {
        return res.status(400).json({
          error: 'Username must be 3-20 characters, letters/numbers/underscore only',
        });
      }

      const { data: existing, error: lookupError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', req.user.id)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      updates.username = username;
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return res.status(400).json({ error: 'Bio must be a string' });
      }
      const trimmed = bio.trim();
      if (trimmed.length > MAX_BIO_LENGTH) {
        return res.status(400).json({ error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer` });
      }
      updates.bio = trimmed;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, username, bio, profile_picture_url, created_at')
      .single();

    if (updateError) throw updateError;

    return res.json({ user: fullUser(updated) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/users/me/change-password  (requires requireAuth)
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
      return res.status(400).json({ error: 'Current password is required' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    const { data: user, error: lookupError } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', req.user.id)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/users/me/avatar  (requires requireAuth + uploadAvatar middleware)
async function uploadProfilePicture(req, res) {
  let uploadedPath = null;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!ALLOWED_MIME[file.mimetype]) {
      return res.status(400).json({ error: 'Only JPG, PNG, WebP allowed' });
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return res.status(400).json({ error: 'File too large (max 2MB)' });
    }

    const ext = ALLOWED_MIME[file.mimetype];
    const filename = `${req.user.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) throw uploadError;
    uploadedPath = filename;

    const { data: publicUrlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filename);

    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) throw new Error('Failed to obtain public URL');

    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture_url: publicUrl })
      .eq('id', req.user.id);

    if (updateError) throw updateError;

    return res.json({ profile_picture_url: publicUrl });
  } catch (err) {
    if (uploadedPath) {
      try {
        await supabase.storage.from(AVATAR_BUCKET).remove([uploadedPath]);
      } catch (cleanupErr) {
        console.error('Avatar cleanup failed:', cleanupErr.message);
      }
    }
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getPublicProfile,
  updateProfile,
  changePassword,
  uploadProfilePicture,
};
