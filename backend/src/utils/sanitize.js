const sanitizeHtml = require('sanitize-html');

/**
 * sanitizeText — for plain-text user content (confession body, profile bio).
 * Strips ALL HTML tags and attributes (none are allowed), decodes nothing into
 * markup, and trims surrounding whitespace. This is our stored-XSS defense: even
 * if the frontend ever rendered this content as HTML, there would be no tags to
 * execute. Returns '' for non-string input.
 *
 * Do NOT use this on email/username/password — they have their own validation
 * and sanitizing could silently corrupt valid values.
 */
function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    // Drop the *contents* of these tags too, so "<script>alert(1)</script>"
    // becomes '' rather than leaving the inner "alert(1)" text behind.
    disallowedTagsMode: 'discard',
    nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
  }).trim();
}

module.exports = { sanitizeText };
