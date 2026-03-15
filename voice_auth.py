import os
import pathlib
import shutil

# DIRECT FIX FOR WinError 1314:
# We monkeypatch pathlib.Path.symlink_to because SpeechBrain/HuggingFace 
# ignores the environment variables on some Windows setups.
def symlink_to_copy_patch(self, target, target_is_directory=False):
    if target_is_directory:
        if self.exists(): shutil.rmtree(self)
        shutil.copytree(str(target), str(self))
    else:
        if self.exists(): os.remove(self)
        shutil.copy2(str(target), str(self))

pathlib.Path.symlink_to = symlink_to_copy_patch

os.environ['SPEECHBRAIN_USE_SYMLINKS'] = 'False'
os.environ['HF_HUB_DISABLE_SYMLINKS'] = '1'

import platform
from speechbrain.pretrained import fetch
if platform.system() == "Windows":
    fetch.USE_SYMLINKS = False

import os
import sounddevice as sd
import soundfile as sf
from speechbrain.pretrained import SpeakerRecognition

VOICE_DB = os.path.abspath(os.path.join(os.path.dirname(__file__), "voice_db"))
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "pretrained_model"))
SAMPLE_RATE = 16000
DURATION = 4
THRESHOLD_VOICE = 0.40

# voice_db is intentionally NOT created anymore because Node.js handles storage
os.makedirs(MODEL_DIR, exist_ok=True)

print("Loading voice model...")
voice_model = SpeakerRecognition.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    savedir=MODEL_DIR
)

# ---------------- RECORD VOICE ----------------
def record_voice(filename):
    input("Press ENTER and speak...")
    for i in range(3, 0, -1):
        print(i)
    print("Speak now!")
    audio = sd.rec(int(DURATION * SAMPLE_RATE),
                   samplerate=SAMPLE_RATE,
                   channels=1)
    sd.wait()
    sf.write(filename, audio, SAMPLE_RATE)

# ---------------- REGISTER ----------------
def register_voice(name):
    file_path = os.path.join(VOICE_DB, name + ".wav")
    record_voice(file_path)
    print("Voice registered!")

# ---------------- AUTHENTICATE ----------------
def verify_voice_score(test_file, target_file):
    if not os.path.exists(target_file):
        print(f"Target file missing: {target_file}")
        return -1
    score, _ = voice_model.verify_files(test_file, target_file)
    return score.item()
def verify_voice_1v1(test_file, target_file):
    if not os.path.exists(target_file):
        print(f"Target file missing: {target_file}")
        return False

    score, _ = voice_model.verify_files(test_file, target_file)
    score = score.item()
    print(f"Comparison Score: {score:.2f}")

    if score > THRESHOLD_VOICE:
        print("Voice matched")
        return True

    print("Voice NOT recognized")
    return False