const Groq = require('groq-sdk');
require('dotenv').config();

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error('Missing GROQ_API_KEY in .env file');
}

const groq = new Groq({ apiKey });

module.exports = groq;
