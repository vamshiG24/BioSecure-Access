import os
import cv2
from deepface import DeepFace

FACE_DB = "face_db"
THRESHOLD_FACE = 0.40  

os.makedirs(FACE_DB, exist_ok=True)


#  Capture face with preview


def capture_face(save_path):

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Cannot open camera")
        return False

    print("\nPress SPACE to capture face (ESC to cancel)")

    while True:
        ret, frame = cap.read()

        if not ret:
            print("Camera error")
            break

        cv2.imshow("Capture Face", frame)

        key = cv2.waitKey(1) & 0xFF

        if key == 32:  # SPACE
            cv2.imwrite(save_path, frame)
            print(f"Face saved → {save_path}")
            break

        elif key == 27:  # ESC
            print("Cancelled")
            cap.release()
            cv2.destroyAllWindows()
            return False

    cap.release()
    cv2.destroyAllWindows()
    return True


# Register new user face

def register_face(name):

    file_path = os.path.join(FACE_DB, name + ".jpg")

    success = capture_face(file_path)

    if success:
        print(f"Face registered for {name}")
    else:
        print("Registration failed")


# Authenticate face of expected user

def authenticate_face(expected_user):

    user_image = os.path.join(FACE_DB, expected_user + ".jpg")

    if not os.path.exists(user_image):
        print("No face registered for this user")
        return False

    test_img = "test_face.jpg"

    success = capture_face(test_img)

    if not success:
        return False

    print("Verifying face...")

    result = DeepFace.verify(
        img1_path=test_img,
        img2_path=user_image,
        enforce_detection=False
    )

    distance = result["distance"]

    print(f"Face distance = {distance:.3f}")

    if distance < THRESHOLD_FACE:
        print("Face authenticated")
        return True

    print("Face NOT matched")
    return False