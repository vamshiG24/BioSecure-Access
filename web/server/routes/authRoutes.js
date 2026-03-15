const express = require('express');
const multer = require('multer');
const { register, verifyVoice, verifyFace } = require('../controllers/authController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.fields([{ name: 'audio' }, { name: 'image' }]), register);
router.post('/verify_voice', upload.single('audio'), verifyVoice);
router.post('/verify_face', upload.single('image'), verifyFace);

module.exports = router;
