const express = require('express');
const rateLimit = require('express-rate-limit');

const {
  registerUser,
  loginUser,
  getCurrentUser,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Register: 5 attempts per IP per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again in an hour.' },
});

// Login: 10 attempts per IP per 15 minutes (brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Forgot password: 5 per IP per hour (prevent email spam / enumeration probing)
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset requests. Please try again in an hour.' },
});

// Reset password: 10 per IP per 15 minutes
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset attempts. Please try again in 15 minutes.' },
});

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.get('/me', requireAuth, getCurrentUser);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.get('/verify-reset-token', resetPasswordLimiter, verifyResetToken);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

module.exports = router;
