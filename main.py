from voice_auth import register_voice, authenticate_voice
from face_auth import register_face, authenticate_face

# ---------------- REGISTER USER ----------------
def register():

    name = input("Enter user name: ")

    register_voice(name)
    register_face(name)

    print(f"\n{name} fully registered!")

# ---------------- AUTHENTICATE ----------------
def authenticate():

    voice_user = authenticate_voice()

    if not voice_user:
        print("\nACCESS DENIED — Voice not recognized")
        return

    face_ok = authenticate_face(voice_user)

    if face_ok:
        print(f"\nACCESS GRANTED → Welcome {voice_user}")
    else:
        print("\nACCESS DENIED — Face mismatch")

# ---------------- MAIN ----------------
def main():

    while True:

        print("\n--- Voice + Face Door Lock ---")
        print("1. Register user")
        print("2. Authenticate")
        print("3. Exit")

        choice = input("Choice: ")

        if choice == "1":
            register()

        elif choice == "2":
            authenticate()

        elif choice == "3":
            break

if __name__ == "__main__":
    main()