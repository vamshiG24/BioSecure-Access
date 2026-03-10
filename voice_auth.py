import os
import sounddevice as sd
import soundfile as sf
from speechbrain.pretrained import SpeakerRecognition
import platform
from speechbrain.pretrained import fetch

if platform.system() == "Windows":
    fetch.USE_SYMLINKS = False

VOICE_DB = "voice_db"
SAMPLE_RATE = 16000
DURATION = 4
THRESHOLD_VOICE = 0.40

os.makedirs(VOICE_DB, exist_ok=True)

print("Loading voice model...")
voice_model = SpeakerRecognition.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    savedir="pretrained_model"
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
def authenticate_voice():

    users = os.listdir(VOICE_DB)

    if len(users) == 0:
        print("No voice users found!")
        return None

    test_file = "test_voice.wav"
    record_voice(test_file)

    best_user = None
    best_score = -1

    for user in users:

        db_file = os.path.abspath(os.path.join(VOICE_DB, user))

        score, _ = voice_model.verify_files(test_file, db_file)
        score = score.item()

        print(f"{user} → Score: {score:.2f}")

        if score > best_score:
            best_score = score
            best_user = user.replace(".wav", "")

    if best_score > THRESHOLD_VOICE:
        print("Voice matched:", best_user)
        return best_user

    print("Voice NOT recognized")
    return None