const { Resend } = require('resend');
require('dotenv').config();

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error('Missing RESEND_API_KEY in .env file');
}

const resend = new Resend(apiKey);

module.exports = resend;
