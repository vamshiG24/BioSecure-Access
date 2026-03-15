import os
import pathlib
import shutil
import platform
import sys
import json
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

        # Convert to real WAV using local ffmpeg
        import imageio_ffmpeg
        import subprocess

        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        # Instead of voice_db, just keep it in uploads cache
        audio_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{username}_audio.wav")

        try:
            subprocess.run(
                [ffmpeg_exe, "-y", "-i", raw_audio_path, "-ar", "16000", audio_path],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
        except subprocess.CalledProcessError as e:
            print("FFMPEG Error:", e.stderr.decode('utf-8', errors='ignore'))
            raise ValueError("Failed to process audio file.")

        print("Saved voice sample:", audio_path)

        # Save face image to uploads cache instead of face_db
        image_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{username}_face.jpg")
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
    # Node.js sends candidate as 'audio'
    if "audio" not in request.files or "targets_meta" not in request.form:
        return jsonify({"success": False, "message": "Missing audio or targets_meta"}), 400

    candidate_file = request.files["audio"]
    targets_meta = json.loads(request.form["targets_meta"])
    targets_files = request.files.getlist("targets")

    try:
        import imageio_ffmpeg
        import subprocess
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

        # 1. Convert candidate
        candidate_filename = secure_filename("candidate_" + candidate_file.filename)
        candidate_raw_path = os.path.join(app.config["UPLOAD_FOLDER"], candidate_filename)
        candidate_file.save(candidate_raw_path)
        print("Received verify candidate:", candidate_raw_path)

        candidate_wav_path = os.path.splitext(candidate_raw_path)[0] + "_converted.wav"
        
        try:
            subprocess.run(
                [ffmpeg_exe, "-y", "-i", candidate_raw_path, "-ar", "16000", candidate_wav_path],
                check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
            )
        except subprocess.CalledProcessError as e:
            print("FFMPEG Error on candidate:", e.stderr.decode('utf-8', errors='ignore'))
            raise ValueError("Failed to process candidate audio.")

        # 2. Convert and test targets
        best_user = None
        best_score = -1

        for t_file in targets_files:
            # Find which user this file belongs to via targets_meta
            t_user = next((u for u, f in targets_meta.items() if f == t_file.filename), None)
            if not t_user: continue

            # Save raw target
            t_raw_path = os.path.join(app.config["UPLOAD_FOLDER"], f"target_{t_user}_{t_file.filename}")
            t_file.save(t_raw_path)

            t_wav_path = os.path.splitext(t_raw_path)[0] + "_converted.wav"
            try:
                subprocess.run(
                    [ffmpeg_exe, "-y", "-i", t_raw_path, "-ar", "16000", t_wav_path],
                    check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
                )
            except subprocess.CalledProcessError:
                continue

            # Compare
            score = voice_auth.verify_voice_score(candidate_wav_path, t_wav_path)
            print(f"{t_user} → Score: {score:.2f}")

            if score > best_score:
                best_score = score
                best_user = t_user

            # Cleanup target temp files
            if os.path.exists(t_raw_path): os.remove(t_raw_path)
            if os.path.exists(t_wav_path): os.remove(t_wav_path)

        # Cleanup candidate test files
        if os.path.exists(candidate_raw_path): os.remove(candidate_raw_path)
        if os.path.exists(candidate_wav_path): os.remove(candidate_wav_path)

        # 3. Decide match
        if best_score > voice_auth.THRESHOLD_VOICE:
            print("Voice matched:", best_user)
            return jsonify({"success": True, "user": best_user})

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

        filename = secure_filename(f"test_{username}_" + file.filename)
        path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(path)

        print("Received face image:", path)

        # Target image is the one in the uploads cache
        user_image = os.path.join(app.config["UPLOAD_FOLDER"], f"{username}_face.jpg")

        match = face_auth.verify_face_headless(path, user_image)

        # Cleanup test file
        if os.path.exists(path): os.remove(path)

        if match:
            return jsonify({"success": True})

        return jsonify({"success": False})

    except Exception as e:
        print("Face error:", repr(e))
        return jsonify({"success": False, "message": str(e)}), 500


# -----------------------------
# DELETE USER
# -----------------------------
@app.route("/api/delete_user", methods=["POST"])
def delete_user():
    username = request.form.get("username")
    if not username:
        return jsonify({"success": False, "message": "Missing username"}), 400
        
    try:
        audio_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{username}_audio.wav")
        image_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{username}_face.jpg")
        
        deleted = False
        if os.path.exists(audio_path):
            os.remove(audio_path)
            deleted = True
        if os.path.exists(image_path):
            os.remove(image_path)
            deleted = True
            
        return jsonify({"success": True, "message": f"User {username} cache cleaned"})
    except Exception as e:
        print("Delete error:", repr(e))
        return jsonify({"success": False, "message": str(e)}), 500


# -----------------------------
# RUN SERVER
# -----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)