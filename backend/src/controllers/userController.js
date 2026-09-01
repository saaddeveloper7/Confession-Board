const bcrypt = require('bcrypt');
const path = require('path');
const supabase = require('../config/supabase');
const { sanitizeText } = require('../utils/sanitize');

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

// Verify the actual bytes of the uploaded buffer match a real image format.
// mimetype is client-supplied and trivially faked, so we inspect the file
// signature (magic bytes) as defense in depth before trusting the upload.
function hasValidImageSignature(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (PNG_SIG.every((byte, i) => buffer[i] === byte)) {
    return true;
  }

  // WebP: bytes 0-3 = "RIFF", bytes 8-11 = "WEBP"
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return true;
  }

  return false;
}

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
    console.error('User route error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
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
      // Sanitize: strip any HTML and trim (stored-XSS defense). Length is
      // validated against the cleaned value, which is what we actually store.
      const cleanBio = sanitizeText(bio);
      if (cleanBio.length > MAX_BIO_LENGTH) {
        return res.status(400).json({ error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer` });
      }
      updates.bio = cleanBio;
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
    console.error('User route error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
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
    console.error('User route error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
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
    // Magic-bytes check: confirm the buffer is genuinely a JPEG/PNG/WebP and
    // not, e.g., an HTML/script file with a faked image mimetype.
    if (!hasValidImageSignature(file.buffer)) {
      return res.status(400).json({ error: 'Invalid image file' });
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
    console.error('User route error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = {
  getPublicProfile,
  updateProfile,
  changePassword,
  uploadProfilePicture,
};
