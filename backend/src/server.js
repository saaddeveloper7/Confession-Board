const express = require('express');
const cors = require('cors');
require('dotenv').config();

const supabase = require('./config/supabase');
const confessionRoutes = require('./routes/confessionRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});