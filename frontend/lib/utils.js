const MOOD_EMOJI = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  funny: '😂',
  neutral: '😐',
};

export function moodEmoji(mood) {
  if (!mood) return '';
  return MOOD_EMOJI[mood] || '';
}
