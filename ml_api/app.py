import os
import pathlib
import shutil
import platform
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# -----------------------------
# Fix Windows symlink problem
# -----------------------------
def symlink_to_copy_patch(self, target, target_is_directory=False):
    if target_is_directory:
        if self.exists():
            shutil.rmtree(self)
        shutil.copytree(str(target), str(self))
    else:
        if self.exists():
            os.remove(self)
        shutil.copy2(str(target), str(self))

pathlib.Path.symlink_to = symlink_to_copy_patch

os.environ["SPEECHBRAIN_USE_SYMLINKS"] = "False"
os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"

from speechbrain.pretrained import fetch

if platform.system() == "Windows":
    fetch.USE_SYMLINKS = False

# -----------------------------
# Import AI modules
# -----------------------------
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import voice_auth
import face_auth

# -----------------------------
# Flask Setup
# -----------------------------
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "uploads")
)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# -----------------------------
# API STATUS
# -----------------------------
@app.route("/api/status")
def status():
    return jsonify({"status": "ML API running"})


# -----------------------------
# REGISTER USER
# -----------------------------
@app.route("/api/register", methods=["POST"])
def register():

    if (
        "audio" not in request.files
        or "image" not in request.files
        or "username" not in request.form
    ):
        return jsonify(
            {"success": False, "message": "Missing audio, image, or username"}
        ), 400

    username = request.form["username"]
    audio_file = request.files["audio"]
    image_file = request.files["image"]

    try:

        # Save raw audio
        raw_audio_path = os.path.join(
            app.config["UPLOAD_FOLDER"], secure_filename(audio_file.filename)
        )
        audio_file.save(raw_audio_path)

        print("Received register audio:", raw_audio_path)

        # Convert to real WAV using librosa and soundfile
        import librosa
        import soundfile as sf

        audio, sr = librosa.load(raw_audio_path, sr=16000)

        audio_path = os.path.join(voice_auth.VOICE_DB, f"{username}.wav")
        sf.write(audio_path, audio, sr)

        print("Saved voice sample:", audio_path)

        # Save face image
        image_path = os.path.join(
            os.path.dirname(__file__), "..", "face_db", f"{username}.jpg"
        )
        image_file.save(image_path)

        print("Saved face image:", image_path)

        return jsonify(
            {"success": True, "message": f"User {username} registered successfully"}
        )

    except Exception as e:
        print("Register error:", repr(e))
        return jsonify({"success": False, "message": str(e)}), 500


# -----------------------------
# VERIFY VOICE
# -----------------------------
@app.route("/api/verify_voice", methods=["POST"])
def verify_voice():

    if "audio" not in request.files:
        return jsonify({"success": False, "message": "No audio file"}), 400

    file = request.files["audio"]

    try:

        filename = secure_filename(file.filename)

        raw_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(raw_path)

        print("Received verify audio:", raw_path)

        # Convert to WAV using librosa and soundfile
        import librosa
        import soundfile as sf

        wav_path = os.path.splitext(raw_path)[0] + "_converted.wav"

        audio, sr = librosa.load(raw_path, sr=16000)
        sf.write(wav_path, audio, sr)

        print("Converted to wav:", wav_path)

        # Voice recognition
        user = voice_auth.verify_voice_headless(wav_path)

        if user:
            return jsonify({"success": True, "user": user})

        return jsonify({"success": False, "message": "Voice not recognized"})

    except Exception as e:
        print("Voice error:", repr(e))
        return jsonify({"success": False, "message": str(e)}), 500


# -----------------------------
# VERIFY FACE
# -----------------------------
@app.route("/api/verify_face", methods=["POST"])
def verify_face():

    if "image" not in request.files or "username" not in request.form:
        return jsonify({"success": False, "message": "Missing data"}), 400

    file = request.files["image"]
    username = request.form["username"]

    try:

        filename = secure_filename(file.filename)

        path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(path)

        print("Received face image:", path)

        user_image = os.path.join(
            os.path.dirname(__file__), "..", "face_db", f"{username}.jpg"
        )

        match = face_auth.verify_face_headless(path, user_image)

        if match:
            return jsonify({"success": True})

        return jsonify({"success": False})

    except Exception as e:
        print("Face error:", repr(e))
        return jsonify({"success": False, "message": str(e)}), 500


# -----------------------------
# RUN SERVER
# -----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)