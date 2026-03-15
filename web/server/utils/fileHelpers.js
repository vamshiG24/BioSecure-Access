const fs = require('fs');
const path = require('path');
const os = require('os');

/** Write a Buffer to a temp file and return its path */
function bufferToTempFile(buffer, filename) {
    const tmpPath = path.join(os.tmpdir(), `biosecure_${Date.now()}_${filename}`);
    fs.writeFileSync(tmpPath, buffer);
    return tmpPath;
}

/** Delete a temp file safely */
function cleanTemp(filepath) {
    try {
        if (filepath && fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    } catch (err) {
        console.error('Failed to clean temp file:', err.message);
    }
}

module.exports = {
    bufferToTempFile,
    cleanTemp
};
