require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

// ──────────────────────────────────────────────
// Middleware & DB
// ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

connectDB();

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', userRoutes);

// Basic status route
app.get('/api/status', (req, res) => {
    res.json({ status: 'Express + MongoDB running (Modular)' });
});

// ──────────────────────────────────────────────
// START
// ──────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
    console.log(`Flask API expected at ${FLASK_API_URL}`);
});
