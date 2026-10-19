require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Initialize app
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// --- Static frontend (PWA) ---
app.use(express.static(path.join(__dirname, '../public')));

// --- API routes ---
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime() });
});

// Auth
app.use('/api/auth', require('./routes/auth'));

// OJT shifts
app.use('/api/ojt', require('./routes/ojt'));

// Repair tracking (laptops + reports)
app.use('/api/repairs', require('./routes/repairs'));

// --- 404 for unmatched /api routes ---
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// --- SPA fallback (serve index.html for non-API, non-static requests) ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// --- Error handler (must be last) ---
app.use(errorHandler);

// --- Start server ---
const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`BlyART server running on port ${PORT}`);
  });
};

start();

module.exports = app;
