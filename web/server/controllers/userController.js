const axios = require('axios');
const FormData = require('form-data');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

// ──────────────────────────────────────────────
// GET ALL USERS (from MongoDB)
// ──────────────────────────────────────────────
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}, { username: 1, login_history: 1, created_at: 1 }).lean();
        const result = users.map(u => ({
            username: u.username,
            total_logins: u.login_history?.length || 0,
            last_login: u.login_history?.length
                ? u.login_history[u.login_history.length - 1]
                : null,
            login_history: u.login_history || [],
        }));
        res.json({ success: true, users: result });
    } catch (err) {
        console.error('Get users error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ──────────────────────────────────────────────
// DELETE USER
// ──────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: 'Missing username' });

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Delete from Cloudinary
        await Promise.all([
            user.audio_public_id ? cloudinary.uploader.destroy(user.audio_public_id, { resource_type: 'video' }) : Promise.resolve(),
            user.image_public_id ? cloudinary.uploader.destroy(user.image_public_id, { resource_type: 'image' }) : Promise.resolve(),
        ]);

        // Delete from MongoDB
        await User.deleteOne({ username });

        // Tell Flask to clean up local cache too
        try {
            const form = new FormData();
            form.append('username', username);
            await axios.post(`${FLASK_API_URL}/api/delete_user`, form, { headers: form.getHeaders() });
        } catch { /* Flask cleanup is best-effort */ }

        res.json({ success: true, message: `User ${username} deleted` });
    } catch (err) {
        console.error('Delete error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};
