const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const FLASK_API_URL = 'http://localhost:5001';

app.use(cors());
app.use(express.json());

// Set up temporary storage for uploaded files before sending to Flask
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// Endpoint to handle registration
app.post('/api/register', upload.fields([{ name: 'audio' }, { name: 'image' }]), async (req, res) => {
    const { username } = req.body;
    if (!req.files || !req.files['audio'] || !req.files['image'] || !username) {
        return res.status(400).json({ success: false, message: 'Missing files or username' });
    }

    try {
        const form = new FormData();
        form.append('audio', fs.createReadStream(req.files['audio'][0].path));
        form.append('image', fs.createReadStream(req.files['image'][0].path));
        form.append('username', username);

        console.log(`Forwarding registration for ${username} to Flask API...`);
        const response = await axios.post(`${FLASK_API_URL}/api/register`, form, {
            headers: { ...form.getHeaders() }
        });

        // Cleanup
        fs.unlinkSync(req.files['audio'][0].path);
        fs.unlinkSync(req.files['image'][0].path);

        res.json(response.data);
    } catch (error) {
        console.error("Error communicating with Flask (register):", error.message);
        // Attempt cleanup
        if (req.files['audio']) fs.unlinkSync(req.files['audio'][0].path);
        if (req.files['image']) fs.unlinkSync(req.files['image'][0].path);
        res.status(500).json({ success: false, message: 'Failed to communicate with the ML Python backend.' });
    }
});

// Health check endpoint
app.route('/api/status').get((req, res) => {
    res.json({ status: 'Express Server is running! Ready to forward to Flask.' });
});

// Endpoint to handle voice verification from React
app.post('/api/verify_voice', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No audio file uploaded' });
    }

    try {
        // Forward the file to the Flask API
        const form = new FormData();
        form.append('audio', fs.createReadStream(req.file.path));

        console.log(`Forwarding ${req.file.filename} to Flask API...`);
        const response = await axios.post(`${FLASK_API_URL}/api/verify_voice`, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        // Delete temp file from Node server after sending to Flask
        fs.unlinkSync(req.file.path);

        // Send Flask's response back to React
        res.json(response.data);

    } catch (error) {
        console.error("Error communicating with Flask:", error.message);
        // Delete temp file on error
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to communicate with the ML Python backend.' 
        });
    }
});

// Endpoint to handle face verification
app.post('/api/verify_face', upload.single('image'), async (req, res) => {
    const { username } = req.body;
    if (!req.file || !username) {
        return res.status(400).json({ success: false, message: 'Missing image or username' });
    }

    try {
        const form = new FormData();
        form.append('image', fs.createReadStream(req.file.path));
        form.append('username', username);

        console.log(`Forwarding face capture of ${username} to Flask API...`);
        const response = await axios.post(`${FLASK_API_URL}/api/verify_face`, form, {
            headers: { ...form.getHeaders() }
        });

        fs.unlinkSync(req.file.path);
        res.json(response.data);
    } catch (error) {
        console.error("Error communicating with Flask (face):", error.message);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: 'Failed to communicate with the ML Python backend.' });
    }
});

app.listen(PORT, () => {
    console.log(`Express server is running on http://localhost:${PORT}`);
    console.log(`Waiting for Flask API at ${FLASK_API_URL}`);
});
