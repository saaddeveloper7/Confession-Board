const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { sendPasswordResetEmail } = require('../services/emailService');

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9_]{3,20}$/;
const MIN_PASSWORD_LENGTH = 6;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const GENERIC_FORGOT_RESPONSE = {
  message: 'If that email exists, a reset link has been sent.',
};

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    bio: row.bio,
    profile_picture_url: row.profile_picture_url,
    created_at: row.created_at,
  };
}

// POST /api/auth/register
async function registerUser(req, res) {
  try {
    const { email, username, password } = req.body || {};

    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    if (typeof username !== 'string' || !USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3-20 characters, letters/numbers/underscore only',
      });
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for existing email or username
    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('email, username')
      .or(`email.eq.${normalizedEmail},username.eq.${username}`);

    if (lookupError) throw lookupError;

    if (existing && existing.length > 0) {
      if (existing.some((u) => u.email === normalizedEmail)) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (existing.some((u) => u.username === username)) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ email: normalizedEmail, username, password_hash }])
      .select('id, email, username, created_at')
      .single();

    if (insertError) throw insertError;

    const token = signToken(newUser);
    return res.status(201).json({ token, user: publicUser(newUser) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/login
async function loginUser(req, res) {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, password_hash, created_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/auth/me  (requires requireAuth middleware)
async function getCurrentUser(req, res) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, bio, profile_picture_url, created_at')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};

    // Validate email shape, but ALWAYS return the same response either way
    // to prevent email enumeration. Just bail early if invalid format.
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return res.json(GENERIC_FORGOT_RESPONSE);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: user, error: lookupError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

      const { error: updateError } = await supabase
        .from('users')
        .update({ reset_token: token, reset_token_expires: expiresAt })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      // Fire and await — but errors inside the email service are logged, not exposed.
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    return res.json(GENERIC_FORGOT_RESPONSE);
  } catch (err) {
    // Log server-side, still return generic success to caller for security.
    console.error('forgotPassword error:', err.message);
    return res.json(GENERIC_FORGOT_RESPONSE);
  }
}

// GET /api/auth/verify-reset-token?token=...
async function verifyResetToken(req, res) {
  const invalid = { valid: false, error: 'Invalid or expired reset link' };
  try {
    const token = req.query?.token;

    if (typeof token !== 'string' || token.length === 0) {
      return res.json({ valid: false, error: 'Invalid reset link' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('reset_token_expires')
      .eq('reset_token', token)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.json(invalid);
    }

    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.json(invalid);
    }

    return res.json({ valid: true });
  } catch (err) {
    console.error('verifyResetToken error:', err.message);
    return res.json(invalid);
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body || {};

    if (typeof token !== 'string' || token.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    const { data: user, error: lookupError } = await supabase
      .from('users')
      .select('id, reset_token, reset_token_expires')
      .eq('reset_token', token)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
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

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};
