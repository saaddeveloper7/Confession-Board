const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const supabase = require('./config/supabase');
const confessionRoutes = require('./routes/confessionRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// --- Security headers (Helmet) ---
// This is a JSON API; the frontend is a separate Next.js app. We disable
// Content-Security-Policy (it governs how a browser loads *this* server's own
// HTML/scripts, of which we serve none) and turn off crossOriginResourcePolicy
// so it never interferes with CORS or with Supabase Storage image URLs (which
// are loaded by the frontend, not proxied through here).
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// --- CORS: locked to the frontend origin only ---
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Feature routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/confessions', confessionRoutes);

// Test route — confirms server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Test route — confirms database connection works
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('confessions')
      .select('*')
      .limit(1);

    if (error) throw error;

    res.json({ status: 'ok', message: 'Database connected', data });
  } catch (err) {
    console.error('test-db error:', err);
    res.status(500).json({ status: 'error', message: 'Database check failed' });
  }
});

// --- Global error handler (must be LAST, after all routes) ---
// Logs the full error server-side but returns a generic message to the client,
// so stack traces / DB structure / file paths are never leaked in responses.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});