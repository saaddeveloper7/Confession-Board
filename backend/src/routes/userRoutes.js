const express = require('express');
const rateLimit = require('express-rate-limit');

const {
  getPublicProfile,
  updateProfile,
  changePassword,
  uploadProfilePicture,
} = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Update profile: 20 per IP per 15 minutes
const updateProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many profile updates. Please try again later.' },
});

// Change password: 5 per IP per hour (sensitive)
const changePasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password changes. Please try again in an hour.' },
});

// Upload avatar: 10 per IP per hour (storage cost protection)
const uploadAvatarLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many avatar uploads. Please try again in an hour.' },
});

router.get('/:username', getPublicProfile);
router.patch('/me', updateProfileLimiter, requireAuth, updateProfile);
router.post('/me/change-password', changePasswordLimiter, requireAuth, changePassword);
router.post('/me/avatar', uploadAvatarLimiter, requireAuth, uploadAvatar, uploadProfilePicture);

module.exports = router;
