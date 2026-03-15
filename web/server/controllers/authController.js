const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const User = require('../models/User');
const { bufferToTempFile, cleanTemp } = require('../utils/fileHelpers');
const { uploadToCloudinary, downloadFromCloudinary } = require('../utils/cloudHelpers');

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

// ──────────────────────────────────────────────
// REGISTER USER
// ──────────────────────────────────────────────
exports.register = async (req, res) => {
    const username = req.body.username;
    if (!username || !req.files || !req.files.audio || !req.files.image) {
        return res.status(400).json({ success: false, message: 'Missing audio, image, or username' });
    }

    let audioTmp, imageTmp;
    try {
        // 1. Temp save files so Cloudinary and Flask can read them
        audioTmp = bufferToTempFile(req.files.audio[0].buffer, 'voice.webm');
        imageTmp = bufferToTempFile(req.files.image[0].buffer, 'face.jpg');

        // 2. Upload to Cloudinary concurrently
        const [audioCloud, imageCloud] = await Promise.all([
            uploadToCloudinary(audioTmp, 'audio', 'video'),
            uploadToCloudinary(imageTmp, 'faces', 'image')
        ]);

        // 3. Send to Flask purely for its "training" / cache prep
        const flaskForm = new FormData();
        flaskForm.append('username', username);
        flaskForm.append('audio', fs.createReadStream(audioTmp));
        flaskForm.append('image', fs.createReadStream(imageTmp));

        await axios.post(`${FLASK_API_URL}/api/register`, flaskForm, { headers: flaskForm.getHeaders() });

        // 4. Save to MongoDB
        await User.findOneAndUpdate(
            { username },
            {
                audio_url: audioCloud.url,
                audio_public_id: audioCloud.public_id,
                image_url: imageCloud.url,
                image_public_id: imageCloud.public_id,
                created_at: new Date(),
                login_history: [],
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: `User ${username} registered successfully` });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        cleanTemp(audioTmp);
        cleanTemp(imageTmp);
    }
};

// ──────────────────────────────────────────────
// VERIFY VOICE (1-to-N Matching)
// ──────────────────────────────────────────────
exports.verifyVoice = async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No audio file' });

    let candidateAudio;
    let targetPaths = []; // Array of { username, path }
    try {
        candidateAudio = bufferToTempFile(req.file.buffer, 'candidate_voice.webm');

        // Fetch ALL users and download their audio
        const users = await User.find({ audio_url: { $exists: true, $ne: null } });
        
        for (const u of users) {
             try {
                 const tmppath = await downloadFromCloudinary(u.audio_url, `${u.username}_target.webm`);
                 targetPaths.push({ username: u.username, path: tmppath });
             } catch (err) {
                 console.log(`Failed to download audio for ${u.username}`, err.message);
             }
        }

        // Forward candidate AND targets to Flask
        const flaskForm = new FormData();
        flaskForm.append('audio', fs.createReadStream(candidateAudio)); 
        
        const targetsMeta = {};
        for (const t of targetPaths) {
            const filename = path.basename(t.path);
            targetsMeta[t.username] = filename;
            flaskForm.append('targets', fs.createReadStream(t.path), filename);
        }
        flaskForm.append('targets_meta', JSON.stringify(targetsMeta));

        const flaskRes = await axios.post(`${FLASK_API_URL}/api/verify_voice`, flaskForm, { headers: flaskForm.getHeaders() });
        res.json(flaskRes.data);
    } catch (err) {
        console.error('Verify voice error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        cleanTemp(candidateAudio);
        for (const t of targetPaths) cleanTemp(t.path);
    }
};

// ──────────────────────────────────────────────
// VERIFY FACE
// ──────────────────────────────────────────────
exports.verifyFace = async (req, res) => {
    const username = req.body.username;
    if (!username || !req.file) return res.status(400).json({ success: false, message: 'Missing image or username' });

    let imageTmp;
    let targetImageTmp;
    try {
        imageTmp = bufferToTempFile(req.file.buffer, 'face.jpg');

        // Get user doc from Mongo
        const user = await User.findOne({ username });
        if (!user || !user.image_url) {
            return res.status(404).json({ success: false, message: 'User not found in mapping' });
        }

        // Download their target face from Cloudinary
        targetImageTmp = await downloadFromCloudinary(user.image_url, `${username}_target_face.jpg`);

        // Forward both to Flask
        const flaskForm = new FormData();
        flaskForm.append('username', username);
        flaskForm.append('image', fs.createReadStream(imageTmp)); 
        flaskForm.append('target_image', fs.createReadStream(targetImageTmp)); 

        const flaskRes = await axios.post(`${FLASK_API_URL}/api/verify_face`, flaskForm, { headers: flaskForm.getHeaders() });

        // If success = True, log login time to Mongo
        if (flaskRes.data.success) {
            user.login_history.push(new Date());
            await user.save();
        }

        res.json(flaskRes.data);
    } catch (err) {
        console.error('Verify face error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        cleanTemp(imageTmp);
        cleanTemp(targetImageTmp);
    }
};
