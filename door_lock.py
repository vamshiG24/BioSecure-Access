import os
import sounddevice as sd
import soundfile as sf
from speechbrain.pretrained import SpeakerRecognition


# Load Speaker Model

print("Loading speaker model...")

model = SpeakerRecognition.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    savedir="pretrained_model"
)


# Create database folder

DB_FOLDER = "voice_db"
os.makedirs(DB_FOLDER, exist_ok=True)


# Record Audio Function

def record_audio(filename, duration=4, samplerate=16000):

    print("\nRecording in:")
    for i in range(3, 0, -1):
        print(i)


    print("Speak now!")

    recording = sd.rec(
        int(duration * samplerate),
        samplerate=samplerate,
        channels=1,
        dtype="float32"
    )

    sd.wait()

    sf.write(filename, recording, samplerate)
    print(f"Recording saved: {filename}")


# Register User

def register_user():

    name = input("Enter user name: ").strip()

    if not name:
        print("Invalid name!")
        return

    filepath = os.path.abspath(os.path.join(DB_FOLDER, f"{name}.wav"))

    record_audio(filepath)

    print(f"\nUser '{name}' registered successfully!")


# Authenticate User

def authenticate():

    users = os.listdir(DB_FOLDER)

    if not users:
        print("\nNo registered users found. Register first!")
        return

    input("\nPress ENTER and speak to authenticate...")

    test_file = os.path.abspath("test.wav")
    record_audio(test_file)

    best_score = -1
    best_user = None

    for user in users:

        db_file = os.path.abspath(os.path.join(DB_FOLDER, user))

        score, prediction = model.verify_files(test_file, db_file)
        score = score.item()

        print(f"Checking with {user} | Score: {score:.2f}")

        if score > best_score:
            best_score = score
            best_user = user

 # Threshold 
    Threshold = 0.4
    if best_score > Threshold:
        print(f"\n✅ Access Granted! Welcome {best_user.split('.')[0]}")
    else:
        print("\n❌ Access Denied!")


# Main Menu

def main():

    while True:

        print("\n--- Voice Door Lock System ---")
        print("1. Register new user")
        print("2. Authenticate user")
        print("3. Exit")

        choice = input("Enter choice: ")

        if choice == "1":
            register_user()

        elif choice == "2":
            authenticate()

        elif choice == "3":
            print("Goodbye!")
            break

        else:
            print("Invalid choice!")



if __name__ == "__main__":
    main()