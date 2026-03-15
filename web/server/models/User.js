const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    audio_url: String,
    audio_public_id: String,
    image_url: String,
    image_public_id: String,
    created_at: { type: Date, default: Date.now },
    login_history: [{ type: Date }],
});

module.exports = mongoose.model('User', userSchema);
