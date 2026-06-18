const supabase = require('../config/supabase');
const { moderateContent, detectMood } = require('../services/aiService');

const MAX_CONTENT_LENGTH = 500;
const ALLOWED_CATEGORIES = ['Relationships', 'Work', 'School', 'Life', 'Funny'];

// Anonymous username generator -> e.g. "SilentFox42"
const adjectives = [
  'Silent', 'Hidden', 'Mystic', 'Quiet', 'Lonely', 'Brave', 'Curious',
  'Sleepy', 'Lucky', 'Clever', 'Gentle', 'Wild', 'Bold', 'Shy', 'Witty',
];
const animals = [
  'Fox', 'Owl', 'Wolf', 'Cat', 'Panda', 'Tiger', 'Bear', 'Hawk',
  'Otter', 'Raven', 'Lion', 'Dolphin', 'Rabbit', 'Falcon', 'Deer',
];

function generateAnonymousUsername() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adj}${animal}${number}`;
}

// POST /api/confessions
async function createConfession(req, res) {
  try {
    const { content, category } = req.body;

    // --- content validation ---
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string' });
    }

    const trimmedContent = content.trim();

    if (trimmedContent === '') {
      return res.status(400).json({ error: 'Content cannot be empty' });
    }

    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({
        error: `Content must be ${MAX_CONTENT_LENGTH} characters or fewer (received ${trimmedContent.length})`,
      });
    }

    // --- category validation (optional field) ---
    let normalizedCategory = null;
    if (category !== undefined && category !== null && category !== '') {
      if (!ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({
          error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
        });
      }
      normalizedCategory = category;
    }

    // --- AI moderation ---
    const moderation = await moderateContent(trimmedContent);
    if (moderation.safe === false) {
      return res.status(400).json({
        error: `Your confession was flagged: ${moderation.reason}`,
      });
    }

    // --- AI mood detection ---
    const { mood } = await detectMood(trimmedContent);

    const anonymous_username = generateAnonymousUsername();

    const { data, error } = await supabase
      .from('confessions')
      .insert([{
        content: trimmedContent,
        anonymous_username,
        category: normalizedCategory,
        mood,
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/confessions
async function getAllConfessions(req, res) {
  try {
    const { data, error } = await supabase
      .from('confessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/confessions/:id
async function getConfessionById(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('confessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Confession not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/confessions/:id
async function deleteConfession(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('confessions')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Confession not found' });
      }
      throw error;
    }

    res.json({ message: 'Confession deleted', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createConfession,
  getAllConfessions,
  getConfessionById,
  deleteConfession,
};
