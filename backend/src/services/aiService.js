const groq = require('../config/groq');

const MODEL = 'llama-3.1-8b-instant';

const MODERATION_SYSTEM_PROMPT = `You are a content moderation classifier for an anonymous confession board.
Flag a confession as unsafe ONLY if it contains any of:
- Hate speech (slurs or targeted attacks on a protected group)
- Violence or threats against a real person
- Sexual content involving minors
- Doxxing (real names, addresses, phone numbers, etc.)
- Direct harassment of a named individual

Venting, profanity, dark humor, sadness, sexual content between consenting adults, and embarrassing admissions are SAFE.

Respond with strict JSON only:
{ "safe": true | false, "reason": "<short reason, empty string if safe>" }`;

const MOOD_SYSTEM_PROMPT = `You classify the dominant emotional mood of a short confession.
Choose exactly ONE of: happy, sad, angry, funny, neutral.
Respond with strict JSON only:
{ "mood": "happy" | "sad" | "angry" | "funny" | "neutral" }`;

const VALID_MOODS = ['happy', 'sad', 'angry', 'funny', 'neutral'];

async function moderateContent(text) {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: MODERATION_SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    return {
      safe: parsed.safe !== false, // default to safe if field missing
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    };
  } catch (err) {
    console.error('Groq moderation failed:', err.message);
    return { safe: true, reason: 'moderation unavailable' };
  }
}

async function detectMood(text) {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: MOOD_SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    const mood = VALID_MOODS.includes(parsed.mood) ? parsed.mood : 'neutral';
    return { mood };
  } catch (err) {
    console.error('Groq mood detection failed:', err.message);
    return { mood: 'neutral' };
  }
}

module.exports = { moderateContent, detectMood };
