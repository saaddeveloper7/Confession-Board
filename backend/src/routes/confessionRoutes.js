const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const {
  createConfession,
  getAllConfessions,
  getConfessionById,
  deleteConfession,
} = require('../controllers/confessionController');

// Rate limit: max 5 POSTs per IP per minute
const createConfessionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Whoa, slow down! You can only post 5 confessions per minute. Try again shortly.',
  },
});

router.post('/', createConfessionLimiter, createConfession);
router.get('/', getAllConfessions);
router.get('/:id', getConfessionById);
router.delete('/:id', deleteConfession);

module.exports = router;
