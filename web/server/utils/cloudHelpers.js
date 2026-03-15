const cloudinary = require('../config/cloudinary');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

/** Upload a local file path to Cloudinary, return { url, public_id } */
async function uploadToCloudinary(filePath, folder, resourceType = 'auto') {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: `biosecure/${folder}`,
        resource_type: resourceType,
    });
    return { url: result.secure_url, public_id: result.public_id };
}

/** Download a Cloudinary URL to a temp file and return its path */
async function downloadFromCloudinary(url, filename) {
    const tmpPath = path.join(os.tmpdir(), `biosecure_${Date.now()}_${filename}`);
    const writer = fs.createWriteStream(tmpPath);
    const response = await axios.get(url, { responseType: 'stream' });
    await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
    return tmpPath;
}

module.exports = {
    uploadToCloudinary,
    downloadFromCloudinary
};
